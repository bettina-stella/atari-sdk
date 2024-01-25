import Socket from 'Socket'

const Atari = function() {
    this.width = 320;
    this.height = 228;
    this.pixel_ratio = 2;

    this.socket = new Socket('foo', 'lish');
}

export default Atari;