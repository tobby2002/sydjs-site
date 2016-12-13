// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/
// var u = new SpeechSynthesisUtterance();
// u.lang = 'ko-KR';
// u.rate = 1.0;

var ConversationPanel = (function() {
  var settings = {
    selectors: {
      chatBox: '#scrollingChat',
      fromUser: '.from-user',
      fromWson: '.from-wson',
      latest: '.latest'
    },
    authorTypes: {
      user: 'user',
      wson: 'wson'
    }
  };

  // Publicly accessible methods defined
  return {
    init: init,
    inputKeyDown: inputKeyDown
  };

  // Initialize the module
  function init() {
    chatUpdateSetup();
    Api.sendRequest( '', null );
    setupInputBox();
  }
  // Set up callbacks on payload setters in Api module
  // This causes the displayMessage function to be called when messages are sent / received
  function chatUpdateSetup() {
    var currentRequestPayloadSetter = Api.setRequestPayload;
    Api.setRequestPayload = function(newPayloadStr) {
    currentRequestPayloadSetter.call(Api, newPayloadStr);
    displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.user);
    };

    var currentResponsePayloadSetter = Api.setResponsePayload;
    Api.setResponsePayload = function(newPayloadStr) {
    currentResponsePayloadSetter.call(Api, newPayloadStr);

      // 크롬 webkit만 가능하게 한다.
      if(('webkitSpeechRecognition' in window)) {

        //음성TTS
        var jsonobj = eval("(" + newPayloadStr + ")");
        var textarray = jsonobj["output"]["text"];
        var speech = new Array();
        // alert(newPayloadStr);
        for (key in textarray) {
          //alert(key);
          speech += textarray[key];
          //alert(speech);
        }

        speech = getTextFromHTML(speech,'',0)
        //alert(speech);
        utterance.text = speech;
        speechUtteranceChunker(utterance, {
          //chunkLength: 120
          chunkLength: 80
        }, function () {
          //some code to execute when done
          //console.log('done');
          //alert("done");

        });
      }


      displayMessage(JSON.parse(newPayloadStr), settings.authorTypes.wson);
    };
  }

// Set up the input box to underline text as it is typed
  // This is done by creating a hidden dummy version of the input box that
  // is used to determine what the width of the input text should be.
  // This value is then used to set the new width of the visible input box.
  function setupInputBox() {
    var input = document.getElementById('textInput');
    var dummy = document.getElementById('textInputDummy');
    var minFontSize = 14;
    var maxFontSize = 16;
    var minPadding = 4;
    var maxPadding = 6;

    // If no dummy input box exists, create one
    if (dummy === null) {
      var dummyJson = {
        'tagName': 'div',
        'attributes': [{
          'name': 'id',
          'value': 'textInputDummy'
        }]
      };

      dummy = Common.buildDomElement(dummyJson);
      document.body.appendChild(dummy);
    }

    function adjustInput() {
      if (input.value === '') {
        // If the input box is empty, remove the underline
        input.classList.remove('underline');
        input.setAttribute('style', 'width:' + '100%');
        input.style.width = '100%';
      } else {
        // otherwise, adjust the dummy text to match, and then set the width of
        // the visible input box to match it (thus extending the underline)
        input.classList.add('underline');
        var txtNode = document.createTextNode(input.value);
        ['font-size', 'font-style', 'font-weight', 'font-family', 'line-height',
          'text-transform', 'letter-spacing'].forEach(function(index) {
            dummy.style[index] = window.getComputedStyle(input, null).getPropertyValue(index);
          });
        dummy.textContent = txtNode.textContent;

        var padding = 0;
        var htmlElem = document.getElementsByTagName('html')[0];
        var currentFontSize = parseInt(window.getComputedStyle(htmlElem, null).getPropertyValue('font-size'), 10);
        if (currentFontSize) {
          padding = Math.floor((currentFontSize - minFontSize) / (maxFontSize - minFontSize)
            * (maxPadding - minPadding) + minPadding);
        } else {
          padding = maxPadding;
        }

        var widthValue = ( dummy.offsetWidth + padding) + 'px';
        input.setAttribute('style', 'width:' + widthValue);
        input.style.width = widthValue;
      }
    }

    // Any time the input changes, or the window resizes, adjust the size of the input box
    input.addEventListener('input', adjustInput);
    window.addEventListener('resize', adjustInput);

    // Trigger the input event once to set up the input box and dummy element
    Common.fireEvent(input, 'input');
  }

  // Display a user or MRTALK message that has just been sent/received
  function displayMessage(newPayload, typeValue) {
    var isUser = isUserMessage(typeValue);
    var textExists = (newPayload.input && newPayload.input.text)
      || (newPayload.output && newPayload.output.text);
    if (isUser !== null && textExists) {

      // Create new message DOM element
      var messageDivs = buildMessageDomElements(newPayload, isUser);
      var chatBoxElement = document.querySelector(settings.selectors.chatBox);
      var previousLatest = chatBoxElement.querySelectorAll((isUser
              ? settings.selectors.fromUser : settings.selectors.fromWson)
              + settings.selectors.latest);
      // Previous "latest" message is no longer the most recent
      if (previousLatest) {
        Common.listForEach(previousLatest, function(element) {
          element.classList.remove('latest');
        });
      }

      messageDivs.forEach(function(currentDiv) {
        chatBoxElement.appendChild(currentDiv);
        // Class to start fade in animation
        currentDiv.classList.add('load');
      });
      // Move chat to the most recent messages when new messages are added
      scrollToChatBottom();
    }
  }

  // Checks if the given typeValue matches with the user "name", the MRTALK "name", or neither
  // Returns true if user, false if MRTALK, and null if neither
  // Used to keep track of whether a message was from the user or MRTALK
  function isUserMessage(typeValue) {
    if (typeValue === settings.authorTypes.user) {
      return true;
    } else if (typeValue === settings.authorTypes.wson) {
      return false;
    }
    return null;
  }

  // Constructs new DOM element from a message payload
  function buildMessageDomElements(newPayload, isUser) {
    var textArray = isUser ? newPayload.input.text : newPayload.output.text;
    if (Object.prototype.toString.call( textArray ) !== '[object Array]') {
      textArray = [textArray];
    }
    var messageArray = [];

    textArray.forEach(function(currentText) {
      if (currentText) {
        var messageJson = {
          // <div class='segments'>
          'tagName': 'div',
          'classNames': ['segments'],
          'children': [{
            // <div class='from-user/from-wson latest'>
            'tagName': 'div',
            'classNames': [(isUser ? 'from-user' : 'from-wson'), 'latest', ((messageArray.length === 0) ? 'top' : 'sub')],
            'children': [{
              // <div class='message-inner'>
              'tagName': 'div',
              'classNames': ['message-inner'],
              'children': [{
                // <p>{messageText}</p>
                'tagName': 'p',
                'text': currentText
              }]
            }]
          }]
        };
        messageArray.push(Common.buildDomElement(messageJson));
      }
    });

    return messageArray;
  }

  // Scroll to the bottom of the chat window (to the most recent messages)
  // Note: this method will bring the most recent user message into view,
  //   even if the most recent message is from MRTALK.
  //   This is done so that the "context" of the conversation is maintained in the view,
  //   even if the MRTALK message is long.
  function scrollToChatBottom() {
    var scrollingChat = document.querySelector('#scrollingChat');

    // Scroll to the latest message sent by the user
    var scrollEl = scrollingChat.querySelector(settings.selectors.fromUser
            + settings.selectors.latest);
    if (scrollEl) {
      scrollingChat.scrollTop = scrollEl.offsetTop;
    }
  }

  // Handles the submission of input
  function inputKeyDown(event, inputBox) {
    // Submit on enter key, dis-allowing blank messages
    if (event.keyCode === 13 && inputBox.value) {
      // Retrieve the context from the previous server response
      var context;
      var latestResponse = Api.getResponsePayload();
      if (latestResponse) {
        context = latestResponse.context;
      }

      // Send the user message
      Api.sendRequest(inputBox.value, context);

      // Clear input box for further messages
      inputBox.value = '';
      Common.fireEvent(inputBox, 'input');
    }
  }



  // html2text
  function addLinksNumber(html,links,linkCounter) {
    var tree =$("<div>"+html+"</div>");
    tree.find("a").each(function (i) {
      var href = $(this).attr('href');
      var text = $(this).text();
      text = text.replace(/\t+/g, "\n");
      if (isAlphanumeric(text)) {
        if (links[linkCounter].indexOf(href) === -1) {
          links[linkCounter].push(href);
        }
        $(this).html("[" + linkCounter + "] " + text);
        linkCounter++;
        links[linkCounter] = [];
      }
    });
    return tree;
  }

  function isEmpty(str) {
    if (str === undefined || str === null) {
      return true;
    }
    return (/^[ \t\s]*$/).test(str);
  }

  function isAlphanumeric(str) {
    return (/[0-9a-zA-Z]+/).test(str);
  }

  function inlineString(str) {
    str = str.replace(/(\r\n|\n|\r)/gm, " ");
    return str.replace(/[\s]+/gm, " ");
  }


  function extractPlainText(obj) {
    var ni = document.createNodeIterator(obj[0], NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, null, false);
    var nodeLine = ni.nextNode(); // go to first node of our NodeIterator
    var plainText = "";
    var tabbed = false;
    while (nodeLine) {
      var text = nodeLine.nodeValue;
      var isDiv = nodeLine.nodeName === "DIV" || nodeLine.nodeName === "TR" || nodeLine.nodeName === "BR";

      if (!isEmpty(text)) {
        plainText += inlineString(nodeLine.nodeValue) + ' ';
      }
      if (isDiv) {
        plainText += '\n';
      }
      nodeLine = ni.nextNode();
    }
    plainText = plainText.replace(/(\r\n|\n|\r){2,}/g, "\n\n");
    return plainText;
  }

  function addLinks(str,links,linkCounter) {
    var linkCount = 1;
    var strBuf = "";
    var i = 0;
    while (i < str.length) {
      var j = str.indexOf("\n", i);
      if (j == -1) j = str.length;
      var line = str.substr(i, j - i);
      var hasLink = true;
      var linkLines = [];
      while (hasLink) {
        hasLink = line.indexOf("[" + linkCount + "]") != -1;
        if (hasLink) {
          linkLines.push(linkCount);
          linkCount++;
        }
      }
      strBuf += line;
      if (linkLines.length > 0) {
        strBuf += '\n Links\n';
        for (var k = 0; k < linkLines.length; k++) {
          var linksUrl = links[linkLines[k]];
          for (var l = 0; l < linksUrl.length; l++) {
            strBuf += '  ' + linkLines[k] + ' - ' + linksUrl[l] + '\n';
          }
        }
      }
      strBuf += '\n';
      i = j + 1;
    }

    return strBuf;
  }

  function getTextFromHTML(html,links,linkCounter) {
    var links = [];
    var linkCounter = 1;
    links[linkCounter] = [];
    var treeHtml = addLinksNumber(html,links,linkCounter);
    var text = extractPlainText(treeHtml);
    text = addLinks(text,links,linkCounter);
    return text;
  }

}());
