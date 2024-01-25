// noinspection JSPotentiallyInvalidUsageOfThis

import ObserverCore from '@mowses/observercore'
import {csrf_token} from './helpers'
import geckos from '@geckos.io/client'

const Socket = function () {
    this.config = new ObserverCore;
    this.channel = null;

    function construct() {
        this.config
            .setData({
                endpoint: null,
                port: null,
                authorization: csrf_token(),
            })
            .watch(['endpoint', 'port', 'authorization'], data => {
                this.disconnect();
            });
    }

    this.connect = function () {
        this.channel = geckos({
            url: this.config.getData('endpoint'),
            port: this.config.getData('port'),
            authorization: this.config.getData('authorization'),
        });

        this.channel.onConnect(function (error) {
            if (error) {
                console.error('ERROR connecting!', error.message);
                return;
            }

            console.log(`You're connected at: ${endpoint}! Joining session...`)
            channel.emit('join');

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

        this.channel.onDisconnect(function () {
            console.log('You got disconnected')
            // game.player.isConnected = false;
        });
    }

    this.disconnect = function () {
        if (!this.channel) return;

        this.channel.close();
    }

    construct = construct.bind(this);
    construct();
};

export default Socket;
