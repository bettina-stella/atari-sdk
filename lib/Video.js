// noinspection JSPotentiallyInvalidUsageOfThis

import Events from '@mowses/events'
import ObserverCore from '@mowses/observercore'
import {current_is_greater_than} from './helpers'
import NTSC_colors from './colors/ntsc'

const Video = function () {
    const width = 320;
    const height = 228;

    this.config = new ObserverCore;
    this.buffer = [];
    this.events = new Events([
        'discarded',
    ]);

    function construct() {
        this.config
            .setData({
                width: width,
                height: height,
            })
            .watch(['width', 'height'], data => {
                set_canvas_size();
            });
    }

    this.destroy = function () {
        canvas.remove();
    }

    this.setBuffer = function (sequence, buffer) {
        if (sequence <= vlast_sequence) {
            if (!current_is_greater_than(sequence, vlast_sequence)) {
                this.events.trigger('discarded', sequence, buffer, vlast_sequence);
                return;
            }
        }

        vlast_sequence = sequence;
        this.buffer = buffer;
    }

    this.getCanvas = function () {
        return canvas;
    }

    this.render = function () {
        if (vlast_sequence === vlast_rendered_sequence) return;
        vlast_rendered_sequence = vlast_sequence;

        function decode_buffer() {
            const _colors = NTSC_colors;
            const output = new Array(width * height);
            const buffer = new Uint8Array(this.buffer.data);
            const textDecoder = new TextDecoder('utf-8');
            const len = 7;
            const color_index_len = 2;
            const uint16len = 5;

            let _next_pixel = 0;

            for (let i = 0, t = buffer.length; i < t; i += len) {
                let v = i + uint16len;
                let i_next = i + len;
                let v_next = i_next + uint16len;

                let _pixel = +textDecoder.decode(buffer.slice(i, v));
                let _color_index = textDecoder.decode(buffer.slice(v, v + color_index_len));
                let _color = _colors[_color_index];

                _next_pixel = +textDecoder.decode(buffer.slice(i_next, v_next));

                if (_next_pixel === 0) {
                    _next_pixel = output.length;
                }

                output.fill(_color, _pixel, _next_pixel);
            }

            return output;
        }

        const _pixels_image = pixels_image;
        const pixels = _pixels_image.data;
        const _width = this.config.getData('width');
        const _height = this.config.getData('height');
        const output = decode_buffer.bind(this)();
        const channels = 4;  // RGBA
        const xmultiplier = _width / width;
        const ymultiplier = _height / height;
        const xmultiplier_step = xmultiplier * channels;
        const ymultiplier_step = ymultiplier * channels;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = x + y * width;
                const color = output[i];
                if (!color) continue;

                const index = ((x * xmultiplier) + (y * ymultiplier) * _width) * channels;

                for (let ystep = ymultiplier_step; ystep > 0; ystep -= channels) {
                    for (let xstep = xmultiplier_step; xstep > 0; xstep -= channels) {
                        let pixel = index - xstep - (_width * ystep);

                        pixels[pixel] = color.r;
                        pixels[pixel + 1] = color.g;
                        pixels[pixel + 2] = color.b;
                    }
                }
            }
        }

        ctx.putImageData(_pixels_image, 0, 0);
    }

    this.getCanvasWidth = function()
    {
        return this.config.getData('width');
    }

    this.getCanvasHeight = function()
    {
        return this.config.getData('height');
    }

    function set_canvas_size()
    {
        canvas.width = this.getCanvasWidth();
        canvas.height = this.getCanvasHeight();

        update_pixels_image();
    }

    function update_pixels_image()
    {
        pixels_image = ctx.getImageData(
            0,
            0,
            this.getCanvasWidth(),
            this.getCanvasHeight()
        );

        /**
         * instead of setting alpha every game cycle
         * we just set it once
         */
        let pixels = pixels_image.data;
        for (let i = 0, t = pixels.length; i < t; i += 4) {
            pixels[i + 3] = 255;
        }
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', {alpha: false, antialias: false});

    let pixels_image = null;
    let vlast_sequence = -1;
    let vlast_rendered_sequence = -1;

    construct = construct.bind(this);
    set_canvas_size = set_canvas_size.bind(this);
    update_pixels_image = update_pixels_image.bind(this);
    construct();
}

export default Video;
