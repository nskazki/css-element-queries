# Manual Element Queries

Like [css-element-queries](https://github.com/marcj/css-element-queries), but require manual recalculation trigger.

It can be useful when you already have 1000+ elements and don't want to have an extra 1000+ [ResizeSensors](https://github.com/tokmak/css-element-queries/blob/master/src/ResizeSensor.js).

## Example

[Live Demo](https://jsfiddle.net/pcoo54e5/31/)

```html
<!DOCTYPE html>
<html>
<head>
</head>
<body>
<body>
<body>
  <p class="block-type1"><span class="desc">Block A with channel-id-1</span></p>
  <p class="block-type1"><span class="desc">Block B with channel-id-1</span></p>

  <hr>

  <p class="block-type2"><span class="desc">Block C with channel-id-2</span></p>
  <p class="block-type2"><span class="desc">Block D with channel-id-2</span></p>
</body>
</body>
</body>
</html>
```

```css
.block-type1,
.block-type2 {
  display: inline-block;
  vertical-align: middle;
  text-align: center;
  background: white;
}

/* block-type1 */
.block-type1[channel-id-1-meq-min-width~="201px"] {
  padding: 50px;
}
.block-type1[channel-id-1-meq-min-width~="201px"] .desc {
  background: orange;
}

.block-type1[channel-id-1-meq-min-width~="101px"][channel-id-1-meq-max-width~="200px"] {
  background: red;
}

.block-type1[channel-id-1-meq-max-width~="100px"] {
  font-size: 12px;
}

/* block-type2 */
.block-type2[channel-id-2-meq-min-height~="71px"] {
  padding: 50px;
}
.block-type2[channel-id-2-meq-min-height~="71px"] .desc {
  background: yellow;
}

.block-type2[channel-id-2-meq-min-height~="61px"][channel-id-2-meq-max-height~="70px"] {
  background: green;
}

.block-type2[channel-id-2-meq-max-height~="60px"] {
  font-size: 12px;
}
```

```javascript
const meq = require('manual-element-queries')
meq.init()

const type1 = toArray(document.querySelectorAll('.block-type1'))
const type2 = toArray(document.querySelectorAll('.block-type2'))

setInterval(() => {
  type1.forEach(span => {
    span.style.width = random(70, 230) + 'px'
    span.style.height = random(50, 80) + 'px'
  })
  meq.recalc('channel-id-1')
}, 1e3)

setInterval(() => {
  type2.forEach(span => {
    span.style.width = random(70, 230) + 'px'
    span.style.height = random(50, 80) + 'px'
  })
  meq.recalc('channel-id-2')
}, 3e3)

function toArray(arrLike) {
  return Array.prototype.slice.call(arrLike)
}

function random(lower, upper) {
  return lower + Math.floor(Math.random() * (upper - lower + 1))
}
```
