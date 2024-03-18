// noinspection JSPotentiallyInvalidUsageOfThis

import Events from '@mowses/events'
import ObserverCore from '@mowses/observercore'
import {current_is_greater_than} from './helpers'
import NTSC_colors from './colors/ntsc'

const Video = function () {
    this.config = new ObserverCore;
    this.buffer = [];
    this.events = new Events([
        'discarded',
    ]);

    function construct() {
        this.config
            .setData({
                width: 320,
                height: 228,
                pixel_ratio: 1,
            })
            .watch(['width', 'height', 'pixel_ratio'], data => {
                set_canvas_size();
            });
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

        const len = 7;
        const uint16len = 5;
        const buffer = new Uint8Array(this.buffer.data);
        const textDecoder = new TextDecoder('utf-8');
        const output = {};

        let v;
        let _pixel;
        let _color_index;

        for (let i = 0, t = buffer.length; i < t; i += len) {
            v = i + uint16len;
            _pixel = +textDecoder.decode(buffer.slice(i, v));
            _color_index = textDecoder.decode(buffer.slice(v, v + 2));
            output[_pixel] = _color_index;
        }

        const _dpr = this.config.getData('pixel_ratio');
        const _pixels_image = pixels_image;
        const _colors = NTSC_colors;
        const _width = _pixels_image.width / _dpr;
        const _height = _pixels_image.height / _dpr;

        let pixels = _pixels_image.data;
        let last = 0;  // same in TIA

        const woffset = 4 * _pixels_image.width;
        let index;
        let output_index;
        let xdpr;
        let ydpr;
        let ydpry1;
        let offset;

        for (let y = 0; y < _height; y++) {
            for (let x = 0; x < _width; x++) {
                index = x + y * _width;
                output_index = output[index];

                if (output_index === undefined) {
                    // missing pixel
                    output_index = last;
                }

                let color = _colors[output_index];

                if (color === undefined) {
                    // console.log('undefined color', index, output_index, last);
                    return;
                }

                xdpr = x * _dpr;
                ydpr = y * _dpr;
                for (let y1 = 0; y1 < _dpr; y1++) {
                    ydpry1 = (ydpr + y1) * woffset;
                    for (let x1 = 0; x1 < _dpr; x1++) {
                        offset = ((xdpr + x1) * 4) + ydpry1;
                        pixels[offset] = color.r;
                        pixels[offset + 1] = color.g;
                        pixels[offset + 2] = color.b;
                    }
                }
                last = output_index;
            }
        }

        ctx.putImageData(_pixels_image, 0, 0);
    }

    this.getCanvasWidth = function()
    {
        return this.config.getData('width') * this.config.getData('pixel_ratio');
    }

    this.getCanvasHeight = function()
    {
        return this.config.getData('height') * this.config.getData('pixel_ratio');
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
