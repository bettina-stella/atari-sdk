// noinspection JSPotentiallyInvalidUsageOfThis

import {uint16Max} from '../helpers.js'
import PlayerKeysEnum from './PlayerKeysEnum.js'
import PlayerKeysMapping from './PlayerKeysMapping.js'
import ObserverCore from '@mowses/observercore'

const PlayerInput = function () {
    this.config = new ObserverCore;

    function construct() {
        this.config
            .setData({
                available: true,
                mapping: Object.assign({}, PlayerKeysMapping),
            })
            .watch('available', data => {
                if (data.new.available === true) {
                    bind_event_listeners();
                } else {
                    unbind_event_listeners();
                }
            })
            .watch('mapping', () => {
                unbind_keys();
                bind_keys();
            });
    }

    this.destroy = function () {
        unbind_keys();
        unbind_event_listeners();
    }

    this.getPressedKeys = function () {
        let pressed = 0;

        Object.entries(keys).forEach(([key, item]) => {
            pressed += item.isDown && PlayerKeysEnum[key];
        });

        return pressed;
    }

    this.getSequence = function () {
        if (++sequence > uint16Max) {
            sequence = 0;
        }

        return sequence;
    }

    function bind_keys() {
        Object.entries(this.config.getData('mapping')).forEach(([key, key_code]) => {
            keys[key] = key_event(key_code);
        });
    }

    function unbind_keys() {
        Object.keys(keys).forEach(key => delete keys[key]);
    }

    function key_event(key_code) {
        return {
            keyCode: key_code,
            isDown: false,
        };
    }

    function handle_key_down(e) {
        Object.entries(keys).forEach(([key, item]) => {
            if (item.keyCode !== e.which) return;
            item.isDown = true;
            e.preventDefault();
        });
    }

    function handle_key_up(e) {
        Object.entries(keys).forEach(([key, item]) => {
            if (item.keyCode !== e.which) return;
            item.isDown = false;
            e.preventDefault();
        });
    }

    function bind_event_listeners() {
        document.addEventListener('keydown', handle_key_down);
        document.addEventListener('keyup', handle_key_up);
    }

    function unbind_event_listeners() {
        document.removeEventListener('keydown', handle_key_down);
        document.removeEventListener('keyup', handle_key_up);
    }

    const keys = {};
    let sequence = -1;

    construct = construct.bind(this);
    bind_keys = bind_keys.bind(this);
    unbind_keys = unbind_keys.bind(this);
    bind_event_listeners = bind_event_listeners.bind(this);
    unbind_event_listeners = unbind_event_listeners.bind(this);
    construct();
}

export default PlayerInput;
