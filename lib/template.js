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
    </style>
  </head>
  <body>

    <script>
       alert("Width: "+window.screen.availWidth+" Height: "+ window.screen.availHeight);
    </script>
    <script>
      function loadImage() {
        var width = isNaN(window.innerWidth) ? window.clientWidth : window.innerWidth;
        var height = isNaN(window.innerHeight) ? window.clientHeight : window.innerHeight;

        var image = document.getElementById("token")
        if (window.screen.availWidth >= window.screen.availHeight) {
            alert("Larger width");
            //image.style.maxHeight = window.screen.availHeight;
            image.style.maxHeight = window.screen.availHeight;
            image.style.width = 'auto';
        } else {
            alert("Larger height");
            image.style.height = 'auto';
            image.style.maxWidth = window.screen.availWidth;
        }
      }
    </script>
    <img src="%s" id="token" onload="loadImage()" />
  </body>
</html>`
