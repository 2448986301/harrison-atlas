import { StrictMode, Suspense, lazy, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { ArrowUpRight, ArrowRight, BookOpen, Check, ChevronRight, FileImage, Layers, Search, ShieldCheck, X, Download, SlidersHorizontal, ExternalLink } from 'lucide-react'
import { layers, articles, type LayerId } from './data'
import { sources as readSources, save, remove, digest, type Source } from './storage'
import 'leaflet/dist/leaflet.css'
import './styles.css'

type Manifest = Omit<Source,'blob'|'url'> & {path:string}
type Article = typeof articles[number]
const MapView = lazy(() => import('./MapView').then(module => ({default:module.MapView})))
function App(){
  const [page,setPage]=useState(location.hash.slice(1)||'overview'),[layer,setLayer]=useState<LayerId>('satellite')
  const [originals,setOriginals]=useState<Source[]>([]),[local,setLocal]=useState<Source[]>([]),[error,setError]=useState('')
  const [query,setQuery]=useState(''),[searchOpen,setSearchOpen]=useState(false),[article,setArticle]=useState<Article|null>(null),[grid,setGrid]=useState(false)
  const dialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null)
  useEffect(()=>{const handler=()=>setPage(location.hash.slice(1)||'overview');window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler)},[])
  useEffect(()=>{
    let active=true;const urls:string[]=[]
    fetch(`${import.meta.env.BASE_URL}originals/manifest.json`).then(r=>{if(!r.ok)throw Error();return r.json()}).then(async(rows:Manifest[])=>{
      const result=await Promise.all(rows.map(async row=>{const response=await fetch(`${import.meta.env.BASE_URL}${row.path}`);if(!response.ok)throw Error();const blob=await response.blob();if(await digest(blob)!==row.hash)throw Error('原图校验失败');const url=URL.createObjectURL(blob);urls.push(url);return {...row,blob,url}}));if(active)setOriginals(result)
    }).catch(()=>{if(active)setError('原图加载或完整性校验失败，请刷新重试。')})
    readSources().then(rows=>{if(active)setLocal(rows)}).catch(()=>{if(active)setError('浏览器未开放本地存储；内置原图仍可正常浏览。')})
    return()=>{active=false;urls.forEach(URL.revokeObjectURL)}
  },[])
  const [localUrls,setLocalUrls]=useState<Source[]>([])
  useEffect(()=>{const rows=local.map(s=>({...s,url:URL.createObjectURL(s.blob)}));setLocalUrls(rows);return()=>rows.forEach(s=>URL.revokeObjectURL(s.url))},[local])
  const all=layers.map(l=>localUrls.find(s=>s.id===l.id)||originals.find(s=>s.id===l.id)).filter((s):s is Source=>!!s)
  const source=all.find(s=>s.id===layer),currentLayer=layers.find(l=>l.id===layer)!
  useEffect(()=>{
    if(article){previousFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal()}
    else if(dialog.current?.open){dialog.current.close();previousFocus.current?.focus()}
  },[article])
  function nav(id:string){location.hash=id;setPage(id);setSearchOpen(false);window.scrollTo({top:0,behavior:'instant'})}
  function explore(id:LayerId){setLayer(id);nav('atlas')}
  async function upload(id:LayerId,file:File,kind:'original'|'art'){
    setError('')
    try{
      if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('请选择 JPEG、PNG 或 WebP 图像。')
      if(file.size>30*1024*1024)throw Error('图像超过 30 MB，请选择较小的文件。')
      const bitmap=await createImageBitmap(file);const width=bitmap.width,height=bitmap.height;bitmap.close()
      const record:Source={id,name:file.name,blob:file,width,height,hash:await digest(file),kind}
      await save(record);setLocal(rows=>[...rows.filter(s=>s.id!==id),record])
    }catch(e){setError(e instanceof Error?e.message:'本地导入失败，请重试。')}
  }
  const results=articles.filter(a=>`${a.title}${a.body}`.includes(query.trim()))
  return <MotionConfig reducedMotion="user"><a className="skip" href="#main-content" onClick={e=>{e.preventDefault();document.getElementById("main-content")?.focus()}}>跳到正文</a>
    <header className="header"><div className="header-inner">
      <a href="#overview" className="brand" onClick={()=>nav('overview')}><img className="brand-flag" src={`${import.meta.env.BASE_URL}symbols/flag.jpg`} alt="国旗"/><span>Harrison<span className="brand-light"> Atlas</span><small>虚构国家地图与百科</small></span></a>
      <nav aria-label="主导航">{[['overview','地图集'],['atlas','地图查看器'],['wiki','百科'],['sources','原始资料']].map(([id,name])=><button className={page===id?'active':''} aria-current={page===id?'page':undefined} key={id} onClick={()=>nav(id)}>{name}</button>)}</nav>
      <button className="search-trigger" aria-label="搜索百科" onClick={()=>{setSearchOpen(!searchOpen);setQuery('')}}><Search size={17}/><span>搜索词条</span><kbd>⌕</kbd></button>
    </div></header>
    <AnimatePresence>{searchOpen&&<motion.div className="search-panel" initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:0.16,ease:[0.23,1,0.32,1]}}>
      <div className="search-input"><Search size={20}/><input autoFocus aria-label="搜索词" placeholder="搜索首都、睿明道、涵宇道…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Escape')setSearchOpen(false)}}/><button aria-label="关闭搜索" onClick={()=>setSearchOpen(false)}><X size={20}/></button></div>
      {results.map(a=><button className="search-result" key={a.id} onClick={()=>{setArticle(a);setSearchOpen(false)}}><BookOpen size={18}/>{a.title}<span>{a.status}</span><ArrowUpRight size={16}/></button>)}{results.length===0&&<p>没有找到相关词条。</p>}
    </motion.div>}</AnimatePresence>
    <main id="main-content" tabIndex={-1}>
      {error&&<div className="error" role="alert">{error}<button aria-label="关闭提示" onClick={()=>setError('')}><X size={16}/></button></div>}
      {page==='overview'&&<>
        <section className="atlas-cover">
          <div className="cover-index">
            <div className="catalog-label">地图集 / 01 至 05</div>
            <h1>Harrison<br/><span>Atlas.</span></h1>
            <p className="cover-intro">国家地图与城市档案</p>
            <div className="cover-view-list">{layers.map((l,i)=><button key={l.id} className={layer===l.id?'chosen':''} onClick={()=>setLayer(l.id)} aria-pressed={layer===l.id}><span className="view-index">0{i+1}</span><span>{l.name}</span><ArrowUpRight size={16}/></button>)}</div>
            <div className="cover-footnote"><img src={`${import.meta.env.BASE_URL}symbols/flag.jpg`} alt="用户确认的国旗原图"/><div><span>国旗</span><p>用户提供的原始旗帜图像</p></div></div>
          </div>
          <button className={`cover-map cover-map-${layer}`} onClick={()=>explore(layer)} aria-label={`打开${currentLayer.name}交互地图`}>
            <img key={layer} src={`${import.meta.env.BASE_URL}originals/${layer}.jpeg`} alt={`${currentLayer.name}原始图像，点击打开地图查看器`}/>
            <div className="cover-map-top"><span>{String(layers.findIndex(l=>l.id===layer)+1).padStart(2,'0')} / {currentLayer.name}</span><span>原始图像</span></div>
            <div className="cover-map-bottom"><span>{layer==='satellite'?'4,172 × 6,294 px':layer==='districts'?'1,099 × 1,080 px':layer==='roads'?'1,079 × 1,091 px':layer==='metro'?'1,080 × 1,358 px':'1,065 × 1,548 px'}</span><span>打开地图 <ArrowUpRight size={18}/></span></div>
          </button>
        </section>
        <section className="city-register">
          <div className="register-heading"><span className="catalog-label">城市档案</span><button onClick={()=>setArticle(articles[0])}><h2>首都</h2><ArrowUpRight size={22}/></button><span className="unconfirmed">名称待确认</span></div>
          <div className="register-stat"><span>人口</span><strong>8,942,013</strong><small>人</small></div>
          <div className="register-stat"><span>海拔</span><strong>5</strong><small>米</small></div>
          <div className="register-stat"><span>面积</span><strong>4,712</strong><small>平方公里</small></div>
          <button className="register-source" onClick={()=>explore('capital')}>查看原始截图 <ArrowUpRight size={14}/></button>
        </section>
        <section className="reading-index"><div className="reading-title"><h2>百科索引</h2><p>目前收录 4 个词条。</p><button onClick={()=>nav('wiki')}>全部词条 <ArrowRight size={17}/></button></div><div className="reading-rows">{articles.map(a=><button key={a.id} onClick={()=>setArticle(a)}><span>{a.category}</span><h3>{a.title}</h3><p>{a.id==='capital'?'人口、海拔与面积':a.id==='flag'?'图像已确认，含义未提供':a.status+'，位置尚未确认'}</p><ArrowUpRight size={18}/></button>)}</div></section>
      </>}
      {page==='atlas'&&<section className="atlas-page"><div className="page-heading"><div><div className="catalog-label">Harrison Atlas / 地图</div><h1>地图查看器</h1></div><p>拖动地图，使用加减按钮缩放。<br/>各图独立展示，尚未进行地理配准。</p></div><div className="atlas-layout"><aside className="atlas-sidebar"><div className="sidebar-label"><Layers size={16}/> 地图视角</div>{layers.map(l=><button key={l.id} className={`layer-choice ${layer===l.id?'selected':''}`} onClick={()=>setLayer(l.id)}><img src={`${import.meta.env.BASE_URL}originals/${l.id}.jpeg`} alt=""/><span>{l.name}<small>{l.en}</small></span>{layer===l.id&&<Check size={16}/>}</button>)}<div className="sidebar-info"><ShieldCheck size={20}/><h3>关于这张地图</h3><p>图像按原样展示，包含手写标注与打码。参考网格仅用于浏览，不代表距离。</p><button onClick={()=>nav('sources')}>查看来源与说明 <ChevronRight size={14}/></button></div></aside><div className="atlas-workspace"><div className="map-toolbar"><div><h2>{currentLayer.name}</h2><span>{source?.kind==='art'?'AI 美术重绘 · 非事实依据':'原始资料'}</span></div><button aria-pressed={grid} onClick={()=>setGrid(!grid)}><SlidersHorizontal size={16}/> 参考网格</button></div><Suspense fallback={<div className="map-shell map-loading">地图查看器加载中…</div>}><MapView source={source} grid={grid}/></Suspense><div className="map-caption"><p>{currentLayer.description}</p>{source&&<a href={source.url} download={source.name}><Download size={15}/> 下载当前图像</a>}</div></div></div></section>}
      {page==='wiki'&&<section className="section wiki-page"><div className="page-heading"><div><div className="catalog-label">Harrison Atlas / 百科</div><h1>百科索引</h1></div><p>收录已确认的地名、首都资料与国旗。<br/>未确认字段暂不填写。</p></div><div className="wiki-grid">{articles.map((a,i)=><button key={a.id} className="wiki-card" onClick={()=>setArticle(a)}><span className="wiki-number">0{i+1} / {a.category}</span><BookOpen size={28}/><h2>{a.title}</h2><p>{a.subtitle}</p><div><span className="pill">{a.status}</span><ArrowUpRight size={19}/></div></button>)}</div><div className="blank-note"><span>⋯</span><h3>暂未收录其他词条。</h3><p>未命名、打码或难以辨认的地名与站名不生成词条。</p></div></section>}
      {page==='sources'&&<section className="section sources-page"><div className="page-heading"><div><div className="catalog-label">Harrison Atlas / 资料</div><h1>原始资料</h1></div><p>5 张地图与 1 张国旗原图。<br/>保留原始分辨率，可逐张下载。</p></div><div className="source-principles"><ShieldCheck size={24}/><div><h3>原始档案是唯一事实依据</h3><p>内置档案没有使用 AI 重绘图。不猜测打码内容，不为未命名城市、车站或行政区命名。「金陵城」保留为待确认。睿明道、涵宇道的名称来自项目确认，空间位置尚未标注。</p></div></div><div className="flag-archive"><img src={`${import.meta.env.BASE_URL}symbols/flag.jpg`} alt="国旗原图"/><div><span className="catalog-label">国家标志</span><h2>国旗</h2><p>用户已确认。旗帜名称、象征含义与制定日期尚未提供。</p><a href={`${import.meta.env.BASE_URL}symbols/flag.jpg`} download="Harrison-flag-original.jpg">下载国旗原图 <Download size={15}/></a></div></div><div className="source-list">{layers.map(l=>{const s=all.find(s=>s.id===l.id),isLocal=local.some(s=>s.id===l.id);return <div className="source-row" key={l.id}><img src={s?.url} alt={`${l.name}当前资料`}/><div className="source-description"><div className="eyebrow">{l.en}</div><h2>{l.name}</h2><span className={`pill ${s?.kind==='art'?'warning':''}`}>{s?.kind==='art'?'AI 美术重绘 · 非事实依据':isLocal?'本机导入 · 身份未经独立验证':'用户提供原图'}</span><p>{s?.width} × {s?.height} px · {isLocal?'仅此浏览器':'随站点保存'}</p><code title={s?.hash}>SHA-256 {s?.hash}</code></div><div className="source-actions"><button onClick={()=>explore(l.id)}>在地图中查看 <ArrowUpRight size={16}/></button>{s&&<a href={s.url} download={s.name}>下载图像 <Download size={15}/></a>}<details><summary>本地替换预览</summary><p>只保存到当前浏览器，不上传。原始档案仍保留在项目中。</p><label>图像身份<select aria-label="图像身份" id={`kind-${l.id}`} defaultValue="original"><option value="original">原图（自行确认）</option><option value="art">AI 美术重绘（非事实）</option></select></label><label className="upload-label">选择图像<input aria-label={`导入${l.name}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const file=e.target.files?.[0];if(file)void upload(l.id,file,(document.getElementById(`kind-${l.id}`) as HTMLSelectElement).value as 'original'|'art');e.target.value=''}}/></label>{isLocal&&<button onClick={async()=>{try{await remove(l.id);setLocal(rows=>rows.filter(s=>s.id!==l.id))}catch{setError('未能重置本地预览，请重试。')}}}>恢复内置原图</button>}</details></div></div>})}</div></section>}
      {!['overview','atlas','wiki','sources'].includes(page)&&<section className="blank-note"><h1>找不到这个页面。</h1><button className="primary" onClick={()=>nav('overview')}>返回地图集</button></section>}
    </main>
    <footer><a href="#overview" className="footer-brand">Harrison Atlas <span>地图与百科</span></a><p>5 张地图 · 4 个词条</p><span>虚构世界档案 · 2026</span></footer>
    <dialog ref={dialog} onCancel={()=>setArticle(null)} onClick={e=>{if(e.target===dialog.current)setArticle(null)}} aria-labelledby="article-title"><button className="dialog-close" aria-label="关闭词条" onClick={()=>setArticle(null)}><X size={20}/></button>{article&&<><div className="eyebrow">HARRISON ATLAS / {article.category}</div><h1 id="article-title">{article.title}</h1><span className="pill">{article.status}</span>{article.id==='flag'&&<img className="article-flag" src={`${import.meta.env.BASE_URL}symbols/flag.jpg`} alt="国旗原图"/>}<p className="article-body">{article.body}</p><dl>{article.facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd aria-label={value||'未确认，留白'}>{value||'—'}</dd></div>)}</dl><div className="article-source"><FileImage size={19}/><p>{article.id==='flag'?'来源：用户本次提供的国旗图像与明确确认。':article.id==='capital'?'来源：首都截图与道路图。三项数据可读；名称待确认。':'来源：用户项目说明中的名称确认。未将其对应到原图区块。'}</p></div><button className="primary" onClick={()=>{if(article.layer)explore(article.layer);else nav('sources');setArticle(null)}}>查看相关原图 <ExternalLink size={16}/></button></>}</dialog>
  </MotionConfig>
}
createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
