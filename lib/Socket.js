import geckos from '@geckos.io/client'
import Events from '@mowses/Events'

const Socket = function () {
    this.channel = null;
    this.config = {
        endpoint: undefined,
        port: undefined,
        authorization: undefined,
    };
    this.events = new Events([
        'connected',
        'reconnected',
        'error connecting',
        'disconnected',
    ]);

    this.connect = function () {
        let reconnected = false;

        this.disconnect();
        this.channel = geckos({
            url: this.config.endpoint,
            port: this.config.port,
            authorization: this.config.authorization,
        });

        this.channel.onConnect(error => {
            if (error) {
                this.events.trigger('error connecting', error);
                return;
            }

            if (reconnected === false) {
                this.events.trigger('connected');
                reconnected = true;
            } else {
                this.events.trigger('reconnected');
            }

            this.channel.emit('join');

            // // console.log(channel);

            // // game.player.isConnected = true;

            // // channel.on('audio received', function(data) {
            // //  if (channel.userData.audioEnabled === false) return;

            // //  let cc = String.fromCharCode;
            // //  let current_sequence = +(data.data.splice(0, 10).map( cp => cc( cp ) ).join(''));
            // //  if (current_sequence < alast_sequence) {
            // //    if (!current_is_greater(current_sequence, alast_sequence)) {
            // //      //console.log('received old audio data... discarding:', current_sequence, alast_sequence);
            // //      return;
            // //    }
            // //  }

            // //  let output = [];
            // //  let len = 7;

            // //  for (var i = 0, t = data.data.length - (len - 1); i < t; i += len) {
            // //    let buffer_index = +(data.data.slice(i, i+5).map( cp => cc( cp ) ).join(''));
            // //    let mixing_table_index = +(data.data.slice(i+5, i+7).map( cp => cc( cp ) ).join(''));
            // //    output[buffer_index] = mixing_table_index;
            // //  }

            // //  audio_manager.appendFragment(build_complete_audio_fragment(output));
            // //  alast_sequence = current_sequence;
            // // })
        });

        this.channel.onDisconnect(() => {
            this.events.trigger('disconnected');
            // game.player.isConnected = false;
        });
    }

    this.disconnect = function () {
        if (!this.channel) return;

        this.channel.close();
    }
};

export default Socket;
