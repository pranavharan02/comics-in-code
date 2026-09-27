// Up-Hill cast. Isla is six: about 0.55 of Grandad's height, big head, short limbs.
// Faces use the head.js presets (work/engine/face2/CAST-UPDATES.md); the preset overrides eye size, jaw and hair volume.
module.exports = {
  isla: { H: 2.55, head: { face: 'isla', skin: '#f4cfae', hair: '#6b3f26', hairLine: '#4a2a18', hairStyle: 'bob', hairline: 0.3, R: 25, lashes: 2, blush: 1, napeLevel: 0.6 },
    top: { color: '#d8453b', sleeve: 'long', type: 'coat', collar: '#b8342e' }, bottom: { type: 'pants', color: '#2f3d63' }, shoes: '#f2c230', shoeType: 'boots', limbs: 1.15, handScale: 1.15 },
  grandad: { H: 3.8, build: 0.95, head: { face: 'grandad', skin: '#f0c49d', hair: '#e9e6e0', hairStyle: 'short', hairline: -1.1, napeLevel: 0.35, sideburn: -0.3, R: 27, tall: 1.15, deep: 0.9, jawW: 0.62, age: 0.8, moustache: '#f3f1ec', browCol: '#f3f1ec', browThick: 1.3, hat: { type: 'cap', color: '#6f6152' } },
    top: { color: '#3f6e4a', sleeve: 'long', type: 'jumper' }, bottom: { type: 'pants', color: '#6e4f3a' }, shoes: '#3a2a22' },
};
