import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { Plus, Minus, Scan, Maximize2 } from 'lucide-react'
import type { Source } from './storage'
export function MapView({source,grid}:{source?:Source;grid:boolean}) {
  const el=useRef<HTMLDivElement>(null), shell=useRef<HTMLDivElement>(null), map=useRef<L.Map|null>(null)
  const [zoom,setZoom]=useState(0)
  useEffect(()=>{
    if(!el.current) return
    const m=L.map(el.current,{crs:L.CRS.Simple,minZoom:-5,maxZoom:3,zoomControl:false,attributionControl:false,zoomSnap:0.25,scrollWheelZoom:false,zoomAnimation:false})
    map.current=m
    m.setView([0,0],0);m.on('zoomend',()=>setZoom(m.getZoom()))
    const observer=new ResizeObserver(()=>m.invalidateSize());observer.observe(el.current)
    return ()=>{observer.disconnect();m.remove();map.current=null}
  },[])
  useEffect(()=>{
    const m=map.current;if(!m||!source?.url)return
    m.stop()
    const bounds=L.latLngBounds([0,0],[source.height,source.width])
    const overlay=L.imageOverlay(source.url,bounds,{alt:source.kind==='original'?`Harrison 原始地图：${source.name}`:`AI 美术重绘，非事实依据：${source.name}`}).addTo(m)
    m.setMaxBounds(new L.LatLngBounds([]))
    m.fitBounds(bounds,{padding:[20,20],animate:false})
    m.setMaxBounds(bounds.pad(0.6))
    return ()=>{overlay.remove()}
  },[source])
  const fit=()=>{if(source)map.current?.fitBounds([[0,0],[source.height,source.width]],{padding:[20,20],animate:false})}
  return <div className={`map-shell ${grid?'show-grid':''}`} ref={shell}>
    <div ref={el} className="map-canvas" tabIndex={0} aria-label="交互地图，可拖动并使用加减按钮缩放"/>
    {!source&&<div className="map-empty">原始地图暂不可用</div>}
    <div className="map-corner"><span className="crosshair">＋</span> HARRISON · ORIGINAL ARCHIVE</div>
    <div className="map-compass" title="图像上方；不代表已确认的地理北向" aria-label="图像上方">TOP<span>↑</span></div>
    <div className="map-controls">
      <button aria-label="放大地图" onClick={()=>map.current?.zoomIn(0.5)}><Plus size={18}/></button>
      <button aria-label="缩小地图" onClick={()=>map.current?.zoomOut(0.5)}><Minus size={18}/></button>
      <span/>
      <button aria-label="显示完整地图" onClick={fit}><Scan size={18}/></button>
      <button aria-label="切换地图全屏" onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void shell.current?.requestFullscreen?.().catch(()=>{})}}><Maximize2 size={17}/></button>
    </div>
    <div className="map-bottom"><span><i/> {source?.kind==='art'?'AI 美术重绘 · 非事实依据':'原始图像 · 未经重绘'}</span><span>图像坐标 / 非地理测量 · {Math.round(2**zoom*100)}%</span></div>
  </div>
}
