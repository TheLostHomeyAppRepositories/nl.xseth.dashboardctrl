'use strict';

// HTML template for show image
exports.html_image = `
<html>
  <head>
    <style>
      body {
        margin: 0px;
        background: %s
      }

      img#token {
        height: 100%;
        width: auto;
        max-width: 100%;
        display: block;
        margin-left: auto;
        margin-right: auto;
      }
    </style>
  </head>
  <body>
    <img src="%s" id="token" />
  </body>
</html>`
