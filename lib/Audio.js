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
                sampleRate: 8000,
            })
            .watch('enabled', (data) => {
                if (data.new.enabled === true) {
                    this.destroy();
                    start();
                } else {
                    this.destroy();
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

    this.destroy = function () {
        if (request_flush_interval) {
            window.clearInterval(request_flush_interval);
        }

        buffer = [];

        if (audio_ctx) {
            audio_ctx.close();
            audio_ctx = null;
        }

        if (gain_node) {
            gain_node = null;
        }
    }

    this.feed = function (sequence, data) {
        if (!audio_ctx || audio_ctx.state !== 'running') return;

        if (sequence <= last_flush_sequence) {
            if (!current_is_greater_than(sequence, last_flush_sequence)) {
                return;
            }
        }

        last_sequence = sequence;

        buffer[sequence % buffer_length] = getFormattedValue(data);

        return this;
    }

    function start() {
        initAudioContext();
        request_flush_interval = window.setInterval(flush, 20);
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

        const _convert_value = convert_value;
        let float32 = new Float32Array(data.length);

        for (let i = 0, t = data.length; i < t; i++) {
            // float32[i] = data[i] / 0x8000;
            float32[i] = data[i] / _convert_value;
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
     * ALSO, I discovered that changing Retroarch's config audio_latency, it does the crackling problem.
     * I think, to solve this problem we should buffer some milliseconds of received audio before we start playing.
     *
     * Maybe this could help:
     * @link https://alemangui.github.io/ramp-to-value
     */
    function flush() {
        last_flush_sequence = last_sequence;

        const samples = flatBuffer();

        if (samples.length === 0) return;

        // console.log(Object.values(buffer).length, '<< number of captured samples');

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
        } else if (start_time - audio_ctx.currentTime > 0.1) {
            // fix audio deviation
            start_time = audio_ctx.currentTime;
        }

        // console.log('start vs current ' + start_time + ' vs ' + audio_ctx.currentTime + ' duration: ' + audioBuffer.duration);
        bufferSource.buffer = audioBuffer;
        bufferSource.loop = false;
        bufferSource.connect(gain_node);
        bufferSource.start(start_time);
        start_time += audioBuffer.duration;
        buffer = [];
    }

    function flatBuffer()
    {
        let output = new Float32Array(0);

        buffer.forEach(function (buffer) {
            output = output.concat(buffer);
        });

        return output;
    }

    const buffer_length = 100;

    let buffer = [];
    let last_sequence = -1;
    let last_flush_sequence = -1;
    let request_flush_interval;
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

    construct();
}

Float32Array.prototype.concat = function() {
    let bytesPerIndex = 4,
        buffers = Array.prototype.slice.call(arguments);

    // add self
    buffers.unshift(this);

    buffers = buffers.map(function (item) {
        if (item instanceof Float32Array) {
            return item.buffer;
        } else if (item instanceof ArrayBuffer) {
            if (item.byteLength / bytesPerIndex % 1 !== 0) {
                throw new Error('One of the ArrayBuffers is not from a Float32Array');
            }
            return item;
        } else {
            throw new Error('You can only concat Float32Array, or ArrayBuffers');
        }
    });

    let concatenatedByteLength = buffers
        .map(function (a) {return a.byteLength;})
        .reduce(function (a,b) {return a + b;}, 0);

    let concatenatedArray = new Float32Array(concatenatedByteLength / bytesPerIndex);

    let offset = 0;
    buffers.forEach(function (buffer, index) {
        concatenatedArray.set(new Float32Array(buffer), offset);
        offset += buffer.byteLength / bytesPerIndex;
    });

    return concatenatedArray;
};

export default Audio;