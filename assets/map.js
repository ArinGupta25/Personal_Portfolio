export async function initMap() {
  const map = document.querySelector('#world-map');
  const layer = document.querySelector('#map-land');
  const tooltip = document.querySelector('#map-tooltip');
  const countrySelect = document.querySelector('#country-select');
  const cards = [...document.querySelectorAll('.map-story-card')];
  const ns = 'http://www.w3.org/2000/svg';
  const create = (tag, attributes = {}) => {
    const element = document.createElementNS(ns, tag);
    Object.entries(attributes).forEach(([key,value]) => element.setAttribute(key,String(value)));
    return element;
  };
  let scale = 1, panX = 0, panY = 0, drag = null, didDrag = false;
  function transform() {
    panX = Math.max(960*(1-scale), Math.min(0,panX));
    panY = Math.max(480*(1-scale), Math.min(0,panY));
    layer.setAttribute('transform', `translate(${panX} ${panY}) scale(${scale})`);
    document.querySelector('#zoom-in').disabled = scale >= 5;
    document.querySelector('#zoom-out').disabled = scale <= 1;
    layer.querySelectorAll('.map-pin').forEach(pin => pin.setAttribute('r', 5/Math.sqrt(scale)));
  }
  function zoom(next) {
    next = Math.max(1,Math.min(5,next));
    const ratio = next/scale;
    panX = 480-(480-panX)*ratio;
    panY = 240-(240-panY)*ratio;
    scale = next; transform();
  }
  document.querySelector('#zoom-in').onclick = () => zoom(scale+.5);
  document.querySelector('#zoom-out').onclick = () => zoom(scale-.5);
  document.querySelector('#reset-map').onclick = () => { scale=1;panX=0;panY=0;transform();selectCountry(''); };
  map.addEventListener('keydown', event => {
    if (event.target !== map) return;
    if (['+','=','-','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) event.preventDefault();
    if (['+','='].includes(event.key)) zoom(scale+.5);
    if (event.key==='-') zoom(scale-.5);
    if (event.key==='ArrowLeft') panX+=45;
    if (event.key==='ArrowRight') panX-=45;
    if (event.key==='ArrowUp') panY+=45;
    if (event.key==='ArrowDown') panY-=45;
    transform();
  });
  map.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    didDrag = false;
    drag = {x:event.clientX,y:event.clientY,panX,panY,pointer:event.pointerId};
  });
  map.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX-drag.x, dy = event.clientY-drag.y;
    if (Math.hypot(dx,dy)>5 && scale>1) {
      didDrag = true; map.classList.add('dragging');
      map.setPointerCapture(event.pointerId);
      const ratio = 960/map.getBoundingClientRect().width;
      panX = drag.panX+dx*ratio;panY=drag.panY+dy*ratio;transform();
    }
  });
  const endDrag = event => { drag=null;map.classList.remove('dragging');if(map.hasPointerCapture(event.pointerId))map.releasePointerCapture(event.pointerId); };
  map.addEventListener('pointerup',endDrag);
  map.addEventListener('pointercancel',endDrag);
  let countries = [], places = [];
  function selectCountry(code, trip = '') {
    const country = countries.find(c => c.properties.code===code);
    const selectedPlaces = places.filter(p => p.countryCode===code);
    const name = country?.properties.name || selectedPlaces[0]?.country || '';
    document.querySelector('#selected-country').textContent = code ? name : 'Select a destination';
    document.querySelector('#country-note').textContent = !code ? (places.length ? 'Select a green country or place marker to open its photographs and travel journals.' : 'No shared journeys yet. Visited countries will turn green as travel stories are added.') : (selectedPlaces.length ? 'Journeys from this destination. Open a journal for the full review, photographs and sources.' : 'No journey has been shared for this country yet.');
    layer.querySelectorAll('.country').forEach(path => {
      const selected = path.dataset.country===code;
      path.classList.toggle('is-selected',selected && path.classList.contains('is-visited'));
      if (path.getAttribute('role') === 'button') path.setAttribute('aria-pressed',String(selected));
    });
    countrySelect.value = selectedPlaces.length ? code : '';
    cards.forEach(card => card.hidden = !!code && (card.dataset.country!==code || (!!trip && card.dataset.trip!==trip)));
    if (code) tooltip.textContent = name;
  }
  countrySelect.addEventListener('change',()=>selectCountry(countrySelect.value));
  transform();
  try {
    const responses = await Promise.all(['assets/countries.geojson','assets/travel.json'].map(async url => {
      const response = await fetch(url);
      if (!response.ok) throw Error('Map data unavailable');
      return response.json();
    }));
    countries = responses[0].features; places = responses[1];
    const visited = new Set(places.map(p=>p.countryCode));
    const project = ([lon,lat]) => [(lon+180)*960/360,(90-lat)*480/180];
    for (const country of countries) {
      const {code,name} = country.properties;
      const polygons = country.geometry.type==='Polygon' ? [country.geometry.coordinates] : country.geometry.coordinates;
      const d = polygons.map(poly=>poly.map(ring=>ring.map((point,i)=>`${i?'L':'M'}${project(point).join(',')}`).join(' ')+'Z').join(' ')).join(' ');
      const path = create('path',{d,class:`country${visited.has(code)?' is-visited':''}`,'data-country':code});
      const title = create('title');title.textContent=`${name}${visited.has(code)?' — visited; open travel stories':''}`;path.append(title);
      path.addEventListener('pointerenter',()=>{tooltip.textContent=name;});
      path.addEventListener('click',()=>{if(!didDrag)selectCountry(code);});
      if (visited.has(code)) {
        path.setAttribute('tabindex','0');path.setAttribute('role','button');path.setAttribute('aria-label',`Explore ${name} travel stories`);path.setAttribute('aria-pressed','false');
        path.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();selectCountry(code);}});
        path.addEventListener('focus',()=>{tooltip.textContent=name;});
      }
      layer.append(path);
    }
    for (const place of places) {
      const [cx,cy] = project([place.lon,place.lat]);
      const marker = create('g',{class:'map-place',tabindex:0,role:'button','aria-label':`Show ${place.title}`});
      marker.append(create('circle',{cx,cy,r:5,class:'map-pin'}));
      const title=create('title');title.textContent=place.title;marker.append(title);
      marker.addEventListener('click',event=>{event.stopPropagation();if(!didDrag)selectCountry(place.countryCode,place.slug);});
      marker.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();selectCountry(place.countryCode,place.slug);}});
      layer.append(marker);
    }
    map.dataset.loaded='true';
  } catch {
    document.querySelector('#map-error').hidden=false;
    // The server-rendered journal cards remain usable when map data fails.
  }
}
