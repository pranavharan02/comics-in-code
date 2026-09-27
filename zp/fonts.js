// Embedded OFL fonts: Letter = Balsamiq Sans Bold (caption caps), Journal = Patrick Hand (handwritten
// sentence case, as in ZP's diary-style strips), Title = Bangers (display / SFX).
const fs = require('fs');
const path = require('path');
const b64 = (f) => fs.readFileSync(path.join(__dirname, '..', 'fonts', f)).toString('base64');
let cache = null;
module.exports = () => cache || (cache = `<style>
@font-face{font-family:'Title';src:url(data:font/ttf;base64,${b64('Bangers-Regular.ttf')})}
@font-face{font-family:'Letter';font-style:normal;src:url(data:font/ttf;base64,${b64('BalsamiqSans-Bold.ttf')})}
@font-face{font-family:'Letter';font-style:italic;src:url(data:font/ttf;base64,${b64('BalsamiqSans-BoldItalic.ttf')})}
@font-face{font-family:'Journal';src:url(data:font/ttf;base64,${b64('PatrickHand-Regular.ttf')})}
</style>`);
