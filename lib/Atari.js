// noinspection JSPotentiallyInvalidUsageOfThis

import ObserverCore from '@mowses/observercore'
import Socket from './Socket'

const Atari = function() {
    this.config = new ObserverCore;
    this.socket = new Socket;

    function construct()
    {
        this.config.setData({
            width: 320,
            height: 228,
            pixel_ratio: 2,
        });
    }

    construct = construct.bind(this);
    construct();
}

export default Atari;