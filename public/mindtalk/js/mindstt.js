/**
 * Created by iosdeveloper on 2016. 12. 13..
 */

    // STT
var miccount = 0;
var mic_icon_on_off = true;  // true : on, false: off
if(!('webkitSpeechRecognition' in window)) {
//        $('#speechbbbbox').html('<strong>지원하지 않는 브라우저입니다.</strong>');
    $('#textInput').attr("placeholder", "여기에 입력후 엔터키, 마이크사용시 크롬뷰어이용");
}
else {
    var mic = new webkitSpeechRecognition();
    mic.continuous = false;
    mic.interimResults = true;
    mic.lang = 'ko-KR';
    $('#speechbbbbox').append('<span class="cning"></span>');
    mic.onresult = function(e) {
        var b = '', c = false;
        for(var i = e.resultIndex; i < e.results.length; ++i) {
            b += e.results[i][0].transcript;
            c = e.results[i].isFinal;
        }

        $('#textInput').attr("placeholder", b);

        if(c) {
            if(true) {
                var inputObj = $('#textInput');
                // Retrieve the context from the previous server response
                var context;
                var latestResponse = Api.getResponsePayload();
                if (latestResponse) {
                    context = latestResponse.context;
                }

                inputObj.value = b;
                // Send the user message
                Api.sendRequest(inputObj.value, context);
                // Clear input box for further messages
                inputObj.value = '';
                Common.fireEvent(inputObj, 'input');
                miccount = 0;

            }
        }

    };
    mic.onend = function() {
        ++miccount;
        if (miccount < 1) {
            mic.start();
            mic_icon_on(mic)
            mic_icon_on_off = false;
        } else {
            miccount = 0
            mic_icon_off(mic)
            mic_icon_on_off = true;
        }
    };

    $('#speechbbbbox img').click(function() {
//        if ($('#speechbbbbox').hasClass('on')) {
        if (mic_icon_on_off) {
            mic.start();
            mic_icon_on(mic)
            mic_icon_on_off = false;
        } else {
            mic.stop();
            mic_icon_off(mic)
            mic_icon_on_off = true;
        }
    });


    function mic_icon_on(mic){
        //alert('마이크로 말하시면 한국어가 입력됩니다.');
        $('#mic_img').attr("src", "../img/mic_on.png");
        $('#textInput').attr("placeholder", "듣고 있는중 ...");
    }

    function mic_icon_off(mic){
        $('#mic_img').attr("src", "../img/mic_off.png");
        $('#textInput').attr("placeholder", "");
    }


    // TTS
    var utterance = new SpeechSynthesisUtterance();
    utterance.lang = "ko-KR";
    utterance.voice = "Yuna";
    utterance.rate = 1.0;
    //utterance.pitch = 2;
    /**
     * Chunkify
     * Google Chrome Speech Synthesis Chunking Pattern
     * Fixes inconsistencies with speaking long texts in speechUtterance objects
     * Licensed under the MIT License
     *
     * Peter Woolley and Brett Zamir
     */

    var speechUtteranceChunker = function (utt, settings, callback) {
        settings = settings || {};
        var newUtt;
        var txt = (settings && settings.offset !== undefined ? utt.text.substring(settings.offset) : utt.text);
        if (utt.voice && utt.voice.voiceURI === 'native') { // Not part of the spec
            newUtt = utt;
            newUtt.text = txt;
            newUtt.addEventListener('end', function () {
                if (speechUtteranceChunker.cancel) {
                    speechUtteranceChunker.cancel = false;
                }
                if (callback !== undefined) {
                    callback();
                }
            });
        }
        else {
            var chunkLength = (settings && settings.chunkLength) || 160;
            var pattRegex = new RegExp('^[\\s\\S]{' + Math.floor(chunkLength / 2) + ',' + chunkLength + '}[.!?,]{1}|^[\\s\\S]{1,' + chunkLength + '}$|^[\\s\\S]{1,' + chunkLength + '} ');
            var chunkArr = txt.match(pattRegex);

            if (chunkArr[0] === undefined || chunkArr[0].length <= 2) {
                //call once all text has been spoken...
                if (callback !== undefined) {
                    callback();
                }
                return;
            }
            var chunk = chunkArr[0];
            newUtt = new SpeechSynthesisUtterance(chunk);
            newUtt.lang = utt.lang;
            var x;
            for (x in utt) {
                if (utt.hasOwnProperty(x) && x !== 'text') {
                    newUtt[x] = utt[x];
                }
            }
            newUtt.addEventListener('end', function () {
                if (speechUtteranceChunker.cancel) {
                    speechUtteranceChunker.cancel = false;
                    return;
                }
                settings.offset = settings.offset || 0;
                settings.offset += chunk.length - 1;
                speechUtteranceChunker(utt, settings, callback);
            });
        }

        if (settings.modifier) {
            settings.modifier(newUtt);
        }
        console.log(newUtt); //IMPORTANT!! Do not remove: Logging the object out fixes some onend firing issues.
        //placing the speak invocation inside a callback fixes ordering and onend issues.
        setTimeout(function () {
            speechSynthesis.speak(newUtt);
        }, 0);
    };

//     utterance.text = "안녕하세요. 미스터톡입니다.";
//     speechUtteranceChunker(utterance, {
//       chunkLength: 120
//     }, function () {
//       //some code to execute when done
//       console.log('done');
//       utterance.cancel();
//     });

//    var speach_icon_on_off = true;
//
//    $('.from-wson .latest .top').click(function() {
//      alert("hi...");
//      if (speach_icon_on_off) {
//        speach_icon_on()
//        speach_icon_on_off = false;
//      } else {
//        speech_icon_off()
//        speach_icon_on_off = true;
//      }
//    });
//
//    function speach_icon_on(){
//      $('.top').css("background-image", "url('../img/mrtalk_on.png')");
//    }
//
//    function speech_icon_off(){
//      $('.top').css("background-image", "url('../img/mrtalk_off.png')");
//    }


}
