import ObserverCore from '@mowses/observercore'
import Socket from './Socket'

const Atari = function() {
    this.config = new ObserverCore();

    // this.socket = new Socket('foo', 'lish');
    function init()
    {
        this.config.setData({
            width: 320,
            height: 228,
            pixel_ratio: 2,
        });
    }

    init = init.bind(this);
    init();
}

export default Atari;