# How to create image map in svg

See GoatImageMapTest.ai for test, and GoatImageMapTest.html for an example of possible output

## Use Adobe Illustrator to make image map

Tutorial on using illustrator on [youtube](https://www.youtube.com/watch?v=bnsx1IZKk34) 

### Steps in Illustrator
 - Download PDF of Vectorized images of skeletons from [Archaeozootheque](https://www.archeozoo.org/archeozootheque/index/category/132-mammiferes_langen_mammals_lang_langes_mamiferos_lang_)
 - Open in Illustrator 
 - Switch Direct Selection tool to Group Selection tool
 - Select group for bone (e.g. skull, scapula, etc.)
 - Open Attributes window (Window > Attributes) and click more option and Show All
   - Change Image Map to Polygon
   - Set URL, e.g. as relative to part like `/skull`
   - Export as SVG
      - Set Images to Link and check Responsive
  
### Steps in code editor
 - Open SVG in code editor, e.g. VS Code
 - Save as HTML
 - Add HTML standard code to the top and move SVG code into `<body>` tags
 - Add CSS to head to make color change on hover as in this youtube tutorial, e.g. 
 - `<style>
        body, html {
            height: 100%;
            display: grid;
        }
        svg {
            width: 95%;
            margin: auto;
        }
        path {
            transition: .6s fill
        }
        #os a path:hover {
            fill: red;
        }
    </style>`