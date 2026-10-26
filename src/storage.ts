import type { LayerId } from './data'
export type Source = { id:LayerId; name:string; blob:Blob; width:number; height:number; hash:string; kind:'original'|'art'; url?:string }
const db = () => new Promise<IDBDatabase>((resolve,reject) => {
  const request = indexedDB.open('harrison-atlas-sources',1)
  request.onupgradeneeded = () => request.result.createObjectStore('sources',{keyPath:'id'})
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})
export async function sources():Promise<Source[]> {
  const database = await db()
  return new Promise((resolve,reject) => {
    const request = database.transaction('sources').objectStore('sources').getAll()
    request.onsuccess = () => { resolve(request.result); database.close() }
    request.onerror = () => { reject(request.error); database.close() }
  })
}
export async function save(source:Source) {
  const database = await db()
  return new Promise<void>((resolve,reject) => {
    const tx = database.transaction('sources','readwrite')
    tx.objectStore('sources').put(source)
    tx.oncomplete = () => {database.close();resolve()}
    tx.onerror = () => {database.close();reject(tx.error)}
  })
}
export async function remove(id:LayerId) {
  const database = await db()
  return new Promise<void>((resolve,reject) => {
    const tx = database.transaction('sources','readwrite'); tx.objectStore('sources').delete(id)
    tx.oncomplete = () => {database.close();resolve()}; tx.onerror=()=>{database.close();reject(tx.error)}
  })
}
export async function digest(blob:Blob) {
  const value = await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())
  return Array.from(new Uint8Array(value),b=>b.toString(16).padStart(2,'0')).join('')
}
