// The ConversationPanel module is designed to handle
// all display and behaviors of the conversation column of the app.
/* eslint no-unused-vars: "off" */
/* global Api: true, Common: true*/

var MrtalkRecongnition = (function() {
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
    // init: init,
    // inputKeyDown: inputKeyDown
  };

  // Initialize the module
  function init() {
    // chatUpdateSetup();
    // Api.sendRequest( '', null );
    // setupInputBox();
  }


  // Handles the submission of input
  function inputSendToMrtalk(inputBox) {
    // Submit on enter key, dis-allowing blank messages
    // if (inputBox.value != '') {
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
    // }
  }
}());
