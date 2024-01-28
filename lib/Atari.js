// noinspection JSPotentiallyInvalidUsageOfThis

import Socket from './Socket'
import Video from './Video'

const Atari = function() {
    this.socket = new Socket;
    this.video = new Video;

    let video_render_request;

    function construct()
    {
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
    }

    function render()
    {
        this.video.render();
        video_render_request = window.requestAnimationFrame(render);
    }

    function stopRender() {
        window.cancelAnimationFrame(video_render_request);
    }

    construct = construct.bind(this);
    render = render.bind(this);
    construct();
}

export default Atari;