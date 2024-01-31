// noinspection JSPotentiallyInvalidUsageOfThis

// based on https://github.com/pkjy/pcm-player

import {current_is_greater_than} from './helpers'
import ObserverCore from '@mowses/observercore'

const Audio = function () {

    this.config = new ObserverCore;

    function construct() {
        this.config
            .setData({
                /**
                 * Browsers do not allow audio to be played before a user gesture,
                 * so we check for a gesture to enable the audio.
                 */
                enabled: navigator.userActivation.isActive === true,
                volume: 1,
                inputCodec: 'Int16',
                channels: 1,
                sampleRate: 44100,
            })
            .watch('enabled', (data) => {
                if (data.new.enabled === true) {
                    start();
                } else {
                    destroy();
                }
            })
            .watch('inputCodec', () => {
                convert_value = getConvertValue();
                typed_array = getTypedArray();
            })
            .watch('change:volume', (data) => {
                const volume = data.new.volume;

                this.config.extendData({
                    enabled: volume > 0,
                }).apply();

                if (gain_node) {
                    gain_node.gain.value = volume;
                }
            });
    }

    this.feed = function (sequence, data) {
        if (!audio_ctx || audio_ctx.state !== 'running') return;

        if (sequence <= last_sequence) {
            if (!current_is_greater_than(sequence, last_sequence)) {
                return;
            }
        }

        last_sequence = sequence;

        data = getFormattedValue(data);
        const tmp = new Float32Array(samples.length + data.length);
        // console.log(data, samples, samples.length)
        tmp.set(samples, 0);
        tmp.set(data, samples.length);
        samples = tmp;

        return this;
    }

    function start() {
        initAudioContext();
        request_animation_frame_interval = window.requestAnimationFrame(requestAnimationFrame);
    }

    function destroy() {
        if (request_animation_frame_interval) {
            window.cancelAnimationFrame(request_animation_frame_interval);
        }

        samples = new Float32Array(0);

        if (audio_ctx) {
            audio_ctx.close();
            audio_ctx = null;
        }

        if (gain_node) {
            gain_node = null;
        }
    }

    function initAudioContext() {
        audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
        // https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createGain
        gain_node = audio_ctx.createGain();
        gain_node.gain.value = this.config.getData('volume');
        gain_node.connect(audio_ctx.destination);
        start_time = audio_ctx.currentTime;
    }

    function getConvertValue() {
        const inputCodec = this.config.getData('inputCodec');
        const inputCodecs = {
            'Int8': 128,
            'Int16': 32768,
            'Int32': 2147483648,
            'Float32': 1
        };

        if (!inputCodecs[inputCodec]) {
            throw new Error('wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32')
        }

        return inputCodecs[inputCodec];
    }

    function getTypedArray() {
        const inputCodec = this.config.getData('inputCodec');
        const typedArrays = {
            'Int8': Int8Array,
            'Int16': Int16Array,
            'Int32': Int32Array,
            'Float32': Float32Array
        };

        if (!typedArrays[inputCodec]) {
            throw new Error('wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32')
        }

        return typedArrays[inputCodec];
    }

    function getFormattedValue(data) {
        if (data.constructor === ArrayBuffer) {
            data = new typed_array(data);
        } else {
            data = new typed_array(data.buffer);
        }

        let float32 = new Float32Array(data.length);

        for (let i = 0, t = data.length; i < t; i++) {
            // float32[i] = data[i] / 0x8000;
            float32[i] = data[i] / convert_value;
        }
        return float32
    }

    /**
     * @TODO
     * I have an issue of crackling audio I could not solve.
     * AFAIK, the problem is caused when we receive audio packets and these packets are played:
     * When the web audio stops playing that packet, the sound wave is NOT near zero NOR near the next (first) packet,
     * causing crackling sounds here and there. It also may happen when the web audio plays the first packet that is not
     * near zero.
     *
     * Maybe this could help:
     * @link https://alemangui.github.io/ramp-to-value
     */
    function flush() {
        if (samples.length === 0) return

        const channels = this.config.getData('channels');
        const sampleRate = this.config.getData('sampleRate');
        const bufferSource = audio_ctx.createBufferSource();
        const length = samples.length / channels;
        const audioBuffer = audio_ctx.createBuffer(channels, length, sampleRate);

        for (let channel = 0; channel < channels; channel++) {
            const audioData = audioBuffer.getChannelData(channel);
            let offset = channel;
            for (let i = 0; i < length; i++) {
                audioData[i] = samples[offset];
                offset += channels;
            }
        }

        if (start_time < audio_ctx.currentTime) {
            start_time = audio_ctx.currentTime;
        }
        // console.log('start vs current ' + start_time + ' vs ' + audio_ctx.currentTime + ' duration: ' + audioBuffer.duration);
        bufferSource.buffer = audioBuffer;
        bufferSource.connect(gain_node);
        bufferSource.start(start_time);
        start_time += audioBuffer.duration;
        samples = new Float32Array(0);
    }

    function requestAnimationFrame() {
        flush();
        request_animation_frame_interval = window.requestAnimationFrame(requestAnimationFrame);
    }

    let samples = new Float32Array(0);
    let last_sequence = -1;
    let request_animation_frame_interval;
    let start_time;
    let typed_array;
    let convert_value;
    let gain_node;
    let audio_ctx;

    construct = construct.bind(this);
    flush = flush.bind(this);
    getConvertValue = getConvertValue.bind(this);
    getFormattedValue = getFormattedValue.bind(this);
    getTypedArray = getTypedArray.bind(this);
    initAudioContext = initAudioContext.bind(this);
    requestAnimationFrame = requestAnimationFrame.bind(this);

    construct();
}

export default Audio;