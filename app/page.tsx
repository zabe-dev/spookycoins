'use client';

import { useMemo, useState } from 'react';

type Coin = { rank:number; name:string; symbol:string; chain:string; logo:string; logoClass:string; marketCap:string; price:string; change:number; launch:string; boost?:'10×'|'30×'|'50×'|'100×'|'500×'; votes:number; submitted:string; category:string; trend:number };

const coins: Coin[] = [
  { rank:1,name:'NeuroMesh',symbol:'NMESH',chain:'SOL',logo:'N',logoClass:'violet',marketCap:'$18.4M',price:'$0.0482',change:28.4,launch:'Aug 21',boost:'500×',votes:18420,submitted:'5d ago',category:'AI',trend:98 },
  { rank:2,name:'Based Pepe',symbol:'BPEPE',chain:'BASE',logo:'B',logoClass:'cyan',marketCap:'$6.7M',price:'$0.00084',change:12.7,launch:'Aug 18',boost:'100×',votes:12790,submitted:'8d ago',category:'Memecoins',trend:91 },
  { rank:3,name:'VaultFi',symbol:'VFI',chain:'ETH',logo:'V',logoClass:'orange',marketCap:'$42.1M',price:'$1.284',change:-3.2,launch:'Jul 30',boost:'50×',votes:11326,submitted:'27d ago',category:'DeFi',trend:85 },
  { rank:4,name:'Pixel Pals',symbol:'PXP',chain:'MATIC',logo:'P',logoClass:'pink',marketCap:'$3.2M',price:'$0.0215',change:8.9,launch:'Aug 23',boost:'30×',votes:9814,submitted:'3d ago',category:'Gaming',trend:81 },
  { rank:5,name:'SuiPilot',symbol:'PILOT',chain:'SUI',logo:'S',logoClass:'blue',marketCap:'$11.8M',price:'$0.173',change:4.1,launch:'Aug 11',boost:'10×',votes:8202,submitted:'15d ago',category:'Utility',trend:77 },
  { rank:6,name:'Arcadia',symbol:'ARCA',chain:'ARB',logo:'A',logoClass:'green',marketCap:'$27.6M',price:'$0.392',change:16.2,launch:'Aug 20',votes:7345,submitted:'6d ago',category:'Gaming',trend:73 },
  { rank:7,name:'Degen Doge',symbol:'DDOGE',chain:'BSC',logo:'D',logoClass:'yellow',marketCap:'$2.9M',price:'$0.000031',change:-6.8,launch:'Aug 24',votes:6891,submitted:'2d ago',category:'Memecoins',trend:68 },
  { rank:8,name:'FanForge',symbol:'FORGE',chain:'AVAX',logo:'F',logoClass:'red',marketCap:'$8.1M',price:'$0.094',change:2.3,launch:'Aug 09',votes:5744,submitted:'17d ago',category:'Fan Token',trend:62 },
];

const presales = [
  { name:'Orbit AI',symbol:'ORBIT',chain:'ETH',status:'LIVE',timing:'Ends in 2d 4h',raised:64,cap:'$320K / $500K',trust:'KYC · Audit',votes:'4,210' },
  { name:'MetaBrawl',symbol:'BRAWL',chain:'SOL',status:'LIVE',timing:'Ends in 5d 11h',raised:42,cap:'$105K / $250K',trust:'Audit',votes:'3,870' },
  { name:'RWA Bridge',symbol:'RWAB',chain:'BASE',status:'UPCOMING',timing:'Starts in 18h',raised:0,cap:'$0 / $800K',trust:'KYC',votes:'2,914' },
];
const categories = ['All','AI','DeFi','Gaming','Memecoins','Utility'];
const formatVotes = (value:number) => new Intl.NumberFormat('en-US').format(value);

export default function Home() {
  const [activeView,setActiveView] = useState<'coins'|'presales'>('coins');
  const [sort,setSort] = useState('Weekly Rank');
  const [category,setCategory] = useState('All');
  const [search,setSearch] = useState('');
  const [voted,setVoted] = useState<string[]>([]);
  const [adVisible,setAdVisible] = useState(true);
  const visibleCoins = useMemo(() => {
    const filtered = coins.filter((coin) => {
      const q = search.toLowerCase();
      return (category === 'All' || coin.category === category) && (!q || `${coin.name} ${coin.symbol} ${coin.chain}`.toLowerCase().includes(q));
    });
    return [...filtered].sort((a,b) => sort==='Trending'?b.trend-a.trend:sort==='Most Voted'?b.votes-a.votes:sort==='24h Gainers'?b.change-a.change:sort==='Market Cap'?b.rank-a.rank:a.rank-b.rank);
  },[category,search,sort]);
  const vote = (symbol:string) => setVoted((current) => current.includes(symbol)?current:[...current,symbol]);

  return (
    <main className={`site-shell ${adVisible?'with-bottom-ad':''}`}>
      <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
      <div className="top-ad-wrap">
        <div className="top-ad desktop-ad"><span>Sponsored</span><b>Launch your token where discovery happens.</b><button>Book placement ↗</button></div>
        <div className="top-ad desktop-ad second"><span>Sponsored</span><b>On-chain analytics for the next big move.</b><button>Explore data ↗</button></div>
        <div className="top-ad mobile-ad"><span>Ad</span><b>Get your project seen</b><button>Promote ↗</button></div>
      </div>
      <header className="nav-shell">
        <a className="brand" href="#"><span className="brand-mark">V</span><span>VYRAL</span><em>beta</em></a>
        <nav><a className="active" href="#markets">Discover</a><a href="#presales">Presales</a><a href="#markets">Trending</a><a href="#portfolio">Portfolio</a></nav>
        <div className="nav-actions"><button className="ghost-btn">Submit coin</button><button className="wallet-btn"><span className="status-dot"/> Connect</button></div>
      </header>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span>●</span> THE COMMUNITY CRYPTO SIGNAL</div>
          <h1>Find what&apos;s<br/><span>moving next.</span></h1>
          <p>Discover early crypto projects, vote for the ones you believe in, and follow the signals that communities create.</p>
          <div className="hero-actions"><button className="primary-btn">Explore rankings <span>↗</span></button><button className="text-btn">How voting works <span>→</span></button></div>
        </div>
        <div className="hero-panel">
          <div className="signal-card">
            <div className="signal-top"><span>LIVE SIGNAL</span><span className="pulse"><i/> Updating now</span></div>
            <div className="signal-coin"><div className="coin-logo violet large">N<span className="chain-badge">S</span></div><div><small>#1 TRENDING</small><strong className="gold-name">NeuroMesh</strong><span>NMESH · SOL</span></div><div className="boost-flag">⚡ 500×</div></div>
            <div className="signal-chart"><div className="chart-line"/><span className="chart-value">+28.4%</span></div>
            <div className="signal-stats"><div><span>Weekly votes</span><b>18,420</b></div><div><span>Market cap</span><b>$18.4M</b></div><div><span>Trending</span><b>98.4</b></div></div>
          </div>
          <div className="float-pill left">🔥 <span><b>+2,841</b> votes today</span></div><div className="float-pill right">⚡ <span><b>3× active</b> · 09:42:18</span></div>
        </div>
      </section>
      <section className="market-strip">
        <div><span>PROJECTS</span><b>14,892</b><small>+126 this week</small></div><div><span>WEEKLY VOTES</span><b>2.48M</b><small>+18.2%</small></div><div><span>COMMUNITIES</span><b>84.2K</b><small>active voters</small></div><div><span>NEXT RESET</span><b>04d : 12h</b><small>Monday 00:00 UTC</small></div>
      </section>
      <section className="rankings" id="markets">
        <div className="section-heading"><div><span className="kicker">LIVE RANKINGS</span><h2>Community leaderboard</h2><p>Rankings reset every Monday. One vote per project, every 12 hours.</p></div><div className="week-chip"><span>WEEK 35</span><b>04d 12h 16m</b><small>until reset</small></div></div>
        <div className="view-tabs"><button className={activeView==='coins'?'selected':''} onClick={()=>setActiveView('coins')}>Launched coins <span>12,480</span></button><button className={activeView==='presales'?'selected':''} onClick={()=>setActiveView('presales')}>Presales <span>2,412</span></button></div>
        {activeView==='coins'?<>
          <div className="filter-bar">
            <label className="search-box"><span>⌕</span><input aria-label="Search projects" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search coin, symbol or chain"/></label>
            <div className="category-scroll">{categories.map((item)=><button key={item} className={category===item?'selected':''} onClick={()=>setCategory(item)}>{item}</button>)}</div>
            <label className="sort-select">Sort: <select value={sort} onChange={(e)=>setSort(e.target.value)}><option>Weekly Rank</option><option>Trending</option><option>Most Voted</option><option>24h Gainers</option><option>Market Cap</option></select></label>
          </div>
          <div className="table-wrap"><table><thead><tr><th>#</th><th>Project</th><th>Market cap</th><th>Price</th><th>24h</th><th>Launch</th><th>Boost</th><th>Weekly votes</th><th>Submitted</th><th/></tr></thead><tbody>{visibleCoins.map((coin)=>{
            const hasVoted=voted.includes(coin.symbol); return <tr key={coin.symbol} className={coin.boost?'boosted-row':''}>
              <td><span className={`rank-number ${coin.rank<=3?'top':''}`}>{coin.rank}</span></td>
              <td><div className="coin-cell"><div className={`coin-logo ${coin.logoClass}`}>{coin.logo}<span className="chain-badge">{coin.chain[0]}</span></div><div><b className={coin.boost?'gold-name':''}>{coin.name}</b><span>{coin.symbol} · {coin.category}</span></div></div></td>
              <td className="numeric">{coin.marketCap}</td><td className="numeric">{coin.price}</td><td><span className={coin.change>=0?'positive':'negative'}>{coin.change>=0?'+':''}{coin.change}%</span></td><td className="muted-cell">{coin.launch}</td>
              <td>{coin.boost?<span className={`boost-badge boost-${coin.boost.replace('×','')}`}>⚡ {coin.boost}</span>:<span className="no-boost">—</span>}</td>
              <td><div className="vote-total"><b>{formatVotes(coin.votes+(hasVoted?1:0))}</b><span>this week</span></div></td><td className="muted-cell">{coin.submitted}</td><td><button className={`vote-btn ${hasVoted?'voted':''}`} onClick={()=>vote(coin.symbol)}>{hasVoted?'Voted ✓':'Vote +1'}</button></td>
            </tr>})}</tbody></table>{!visibleCoins.length&&<div className="empty-state">No projects match those filters.</div>}</div>
        </>:<div className="presale-grid" id="presales">{presales.map((sale,index)=><article className="presale-card" key={sale.symbol}>
          <div className="presale-top"><span className="presale-rank">#{index+1}</span><span className={`sale-status ${sale.status.toLowerCase()}`}>{sale.status}</span></div>
          <div className="presale-name"><div className={`coin-logo ${['violet','orange','cyan'][index]}`}>{sale.name[0]}<span className="chain-badge">{sale.chain[0]}</span></div><div><b>{sale.name}</b><span>{sale.symbol} · {sale.chain}</span></div></div>
          <div className="sale-timing"><span>{sale.timing}</span><b>{sale.cap}</b></div><div className="progress"><i style={{width:`${sale.raised}%`}}/></div><div className="progress-label"><span>{sale.raised}% raised</span><span>{sale.trust}</span></div>
          <div className="presale-bottom"><span><b>{sale.votes}</b> weekly votes</span><button>View presale →</button></div>
        </article>)}</div>}
        <div className="table-footer"><span>Showing {activeView==='coins'?visibleCoins.length:presales.length} featured projects</span><button>View all projects <span>→</span></button></div>
      </section>
      <section className="bottom-cta" id="portfolio"><span className="kicker">BUILT FOR EARLY DISCOVERY</span><h2>Your next conviction<br/>starts with a signal.</h2><p>Create a free account to vote, build your private portfolio and follow the projects moving up the ranks.</p><button className="primary-btn">Create free account <span>↗</span></button></section>
      <footer><a className="brand" href="#"><span className="brand-mark">V</span><span>VYRAL</span></a><p>Community-powered crypto discovery.</p><div><a href="#">Methodology</a><a href="#">Advertise</a><a href="#">Submit project</a><a href="#">Terms</a></div></footer>
      {adVisible&&<aside className="bottom-ad" aria-label="Advertisement"><div className="bottom-ad-inner"><span className="ad-label">SPONSORED</span><div className="ad-brand">NOVA<span>DEX</span></div><p>Trade early. Trade fast. Trade on-chain.</p><button className="ad-cta">Launch app ↗</button><button className="ad-close" onClick={()=>setAdVisible(false)} aria-label="Close advertisement">×</button></div></aside>}
    </main>
  );
}
