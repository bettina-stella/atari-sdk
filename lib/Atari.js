// noinspection JSPotentiallyInvalidUsageOfThis

import Audio from './Audio'
import Socket from './Socket'
import Video from './Video'
import PlayerInput from './PlayerInput/PlayerInput.js'
import ObserverCore from '@mowses/observercore'

const Atari = function() {
    this.audio = new Audio;
    this.config = new ObserverCore;
    this.socket = new Socket;
    this.video = new Video;
    this.players = {
        p1: new PlayerInput,
        p2: new PlayerInput,
    };

    let video_render_request;
    let player1_last_pressed_keys;
    let player1_input_packets_to_send;
    let player2_last_pressed_keys;
    let player2_input_packets_to_send;

    function construct()
    {
        this.audio.config
            .extendData({
                inputCodec: 'Int8',
                channels: 1,
                sampleRate: 8000,
            });

        this.config
            .setData({
                input_packet_max_resend_attempts: 30,
            });

        this.socket.events
            .on('connected', () => {
                this.socket.channel.on('video received', ([sequence, buffer]) => {
                    this.video.setBuffer(sequence, buffer);
                });

                render();
            })
            .on('disconnected', () => {
                stopRender()
            });

        bindAudioEvents();
    }

    function render()
    {
        this.video.render();
        sendInputs();
        video_render_request = window.requestAnimationFrame(render);
    }

    function sendInputs()
    {
        const max_attempts = this.config.getData('input_packet_max_resend_attempts');

        sendPlayer1Inputs(max_attempts);
        sendPlayer2Inputs(max_attempts);
    }

    function sendPlayer1Inputs(max_attempts)
    {
        if (this.players.p1.config.getData('available') !== true) return;

        const player1_pressed_keys = this.players.p1.getPressedKeys();

        if (player1_pressed_keys !== player1_last_pressed_keys) {
            player1_last_pressed_keys = player1_pressed_keys;
            player1_input_packets_to_send = max_attempts;
        }

        if (player1_input_packets_to_send-- > 0) {
            // console.log('pressed keys', player1_pressed_keys, 'packets left:', player1_input_packets_to_send, this.players.p1.getSequence());
            this.socket.channel.emit('presskey-player-1', [this.players.p1.getSequence(), player1_pressed_keys]);
        }
    }

    function sendPlayer2Inputs(max_attempts)
    {
        if (this.players.p2.config.getData('available') !== true) return;

        const player2_pressed_keys = this.players.p2.getPressedKeys();

        if (player2_pressed_keys !== player2_last_pressed_keys) {
            player2_last_pressed_keys = player2_pressed_keys;
            player2_input_packets_to_send = max_attempts;
        }

        if (player2_input_packets_to_send-- > 0) {
            // console.log('pressed keys', player2_pressed_keys, 'packets left:', player2_input_packets_to_send, this.players.p2.getSequence());
            this.socket.channel.emit('presskey-player-2', [this.players.p2.getSequence(), player2_pressed_keys]);
        }
    }

    function bindAudioEvents() {
        this.socket.events
            .on('connected', () => {
                this.socket.channel
                    .on('audio received', ([sequence, buffer]) => {
                        this.audio.feed(sequence, new Int8Array(buffer.data));
                    });
            });

        /**
         * Browsers do not allow audio to be played before a user gesture,
         * so we check for a gesture to start the audio.
         */
        let user_gesture_check_interval = window.setInterval(() => {
            if (navigator.userActivation.isActive) {
                window.clearInterval(user_gesture_check_interval);
                this.audio.config.extendData({
                    enabled: true,
                });
            }
        }, 1000);
    }

    function stopRender() {
        window.cancelAnimationFrame(video_render_request);
    }

    construct = construct.bind(this);
    render = render.bind(this);
    sendInputs = sendInputs.bind(this);
    sendPlayer1Inputs = sendPlayer1Inputs.bind(this);
    sendPlayer2Inputs = sendPlayer2Inputs.bind(this);
    bindAudioEvents = bindAudioEvents.bind(this);
    construct();
}

export default Atari;