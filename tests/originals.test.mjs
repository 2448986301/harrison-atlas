import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
const root = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('public/originals/manifest.json',root),'utf8'))
const expected = {
  satellite:'c08d2d26c3b66c0fe7d330670586134a9f5ebef4d9766ab507652844b081720a',
  roads:'f6f51446ba23dfe9849e9fb88c6d4a8815eaaf67bbd2bf9ad57bc1a3bfc45982',
  districts:'a51b22b65df8073d94cb29fff2b0ab337731208ebb620c32847be00e88e65097',
  metro:'fd9a0bcf53c7c5195bb3979bb85a343c96c272faa06f0c8431b914a83a573e34',
  capital:'abc6050d7513c5960f253c97f067adad55c37312649882a80b4c0c61061d08b6'
}
test('all five supplied originals remain byte-identical',async()=>{
  assert.equal(manifest.length,5)
  assert.deepEqual(new Set(manifest.map(x=>x.id)),new Set(Object.keys(expected)))
  for(const item of manifest){
    assert.equal(item.kind,'original')
    const bytes=await readFile(new URL('public/'+item.path,root))
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected[item.id])
    assert.equal(item.hash,expected[item.id])
    assert.ok(item.width>1000 && item.height>1000)
  }
})
test('the confirmed flag remains byte-identical',async()=>{
  const meta=JSON.parse(await readFile(new URL('public/symbols/flag.json',root),'utf8'))
  const bytes=await readFile(new URL('public/'+meta.path,root))
  const hash=createHash('sha256').update(bytes).digest('hex')
  assert.equal(hash,'1cbd1356fcdce3c8e7dde6603d5c33f38134706c989ddfdf7b4176953f605828')
  assert.equal(hash,meta.hash)
  assert.equal(meta.role,'国旗：用户明确确认')
})
