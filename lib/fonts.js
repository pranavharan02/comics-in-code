// Embed the OFL fonts as data URIs so every SVG is self-contained.
const fs = require('fs');
const path = require('path');
const b64 = (f) => fs.readFileSync(path.join(__dirname, '..', 'fonts', f)).toString('base64');
module.exports = () => `<style>
@font-face{font-family:'Title';src:url(data:font/ttf;base64,${b64('Bangers-Regular.ttf')})}
@font-face{font-family:'Letter';font-style:normal;src:url(data:font/ttf;base64,${b64('BalsamiqSans-Bold.ttf')})}
@font-face{font-family:'Letter';font-style:italic;src:url(data:font/ttf;base64,${b64('BalsamiqSans-BoldItalic.ttf')})}
@font-face{font-family:'Hand';src:url(data:font/ttf;base64,${b64('PatrickHandSC-Regular.ttf')})}
</style>`;
