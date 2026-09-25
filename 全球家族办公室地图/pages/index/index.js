const countriesData = require('../../data/countries.js');
const offices = require('../../data/family-office-locations.js');

const DEG = Math.PI / 180;
const DEFAULT_VIEW = { lat: 24, lng: 40, zoom: 1 };

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function touchPoint(touch) {
  if (!touch) return null;
  const x = touch.x !== undefined ? touch.x : (touch.clientX !== undefined ? touch.clientX : (touch.pageX !== undefined ? touch.pageX : touch.screenX));
  const y = touch.y !== undefined ? touch.y : (touch.clientY !== undefined ? touch.clientY : (touch.pageY !== undefined ? touch.pageY : touch.screenY));
  return {
    x: Number(x || 0),
    y: Number(y || 0)
  };
}

function collectRings(geometry, rings) {
  if (!geometry) return;
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach((ring) => rings.push(ring));
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => rings.push(ring)));
  }
}

function simplifyRing(ring) {
  if (!ring || ring.length < 2) return ring || [];
  const step = Math.max(1, Math.ceil(ring.length / 180));
  const simplified = ring.filter((_, index) => index % step === 0);
  const last = ring[ring.length - 1];
  if (simplified[simplified.length - 1] !== last) simplified.push(last);
  return simplified;
}

function prepareCountries() {
  return (countriesData.features || []).map((feature) => {
    const properties = feature.properties || {};
    const rings = [];
    collectRings(feature.geometry, rings);
    const coordinates = rings.reduce((all, ring) => all.concat(ring), []);
    const bounds = coordinates.reduce((result, point) => ({
      minLng: Math.min(result.minLng, point[0]),
      maxLng: Math.max(result.maxLng, point[0]),
      minLat: Math.min(result.minLat, point[1]),
      maxLat: Math.max(result.maxLat, point[1])
    }), { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 });
    return {
      name: properties.NAME_ZH || properties.NAME || 'Unknown',
      labelLat: Number(properties.LABEL_Y),
      labelLng: Number(properties.LABEL_X),
      bounds,
      rings: rings.map(simplifyRing)
    };
  });
}

const countries = prepareCountries();

Page({
  data: {
    searchOpen: false,
    searchQuery: '',
    legendOpen: false,
    detailOpen: false,
    selectedName: '',
    selectedDescription: ''
  },

  onLoad() {
    const system = tt.getSystemInfoSync();
    this.viewport = {
      width: system.windowWidth,
      height: system.windowHeight
    };
    this.view = { ...DEFAULT_VIEW };
    this.ctx = tt.createCanvasContext('globe-canvas', this);
    this.dragging = false;
    this.moved = false;
    this.lastTouch = null;
    this.lastDistance = 0;
    this.renderFrame();
    this.autoRotateTimer = setInterval(() => {
      if (!this.dragging && !this.data.detailOpen && !this.data.searchOpen && !this.data.legendOpen) {
        this.view.lng = (this.view.lng + 0.08 + 540) % 360 - 180;
        this.renderFrame();
      }
    }, 70);
  },

  onUnload() {
    if (this.autoRotateTimer) clearInterval(this.autoRotateTimer);
  },

  project(lng, lat) {
    const lat0 = this.view.lat * DEG;
    const dLng = (lng - this.view.lng) * DEG;
    const latRad = lat * DEG;
    const cosLat = Math.cos(latRad);
    const x = cosLat * Math.sin(dLng);
    const y = Math.sin(latRad) * Math.cos(lat0) - cosLat * Math.cos(dLng) * Math.sin(lat0);
    const z = Math.sin(latRad) * Math.sin(lat0) + cosLat * Math.cos(dLng) * Math.cos(lat0);
    const radius = Math.min(this.viewport.width, this.viewport.height) * 0.43 * this.view.zoom;
    const center = this.getGlobeCenter();
    return {
      x: this.viewport.width / 2 + x * radius,
      y: center.y - y * radius,
      z
    };
  },

  getGlobeCenter() {
    return {
      x: this.viewport.width / 2,
      y: this.viewport.height * 0.53
    };
  },

  renderFrame() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const width = this.viewport.width;
    const height = this.viewport.height;
    const radius = Math.min(width, height) * 0.43 * this.view.zoom;

    ctx.clearRect(0, 0, width, height);
    ctx.setFillStyle('#08090b');
    ctx.fillRect(0, 0, width, height);

    const center = this.getGlobeCenter();
    const cx = center.x;
    const cy = center.y;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 9, 0, Math.PI * 2);
    ctx.setFillStyle('rgba(150, 155, 162, .08)');
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.setFillStyle('#15171a');
    ctx.fill();

    countries.forEach((country) => {
      country.rings.forEach((ring) => this.drawRing(ring));
    });

    offices.forEach((office) => {
      const point = this.project(office.lng, office.lat);
      if (point.z <= 0.04) return;
      const pointRadius = clamp(1.7 + Math.sqrt(office.count || 1) * 0.38, 2, 6);
      ctx.beginPath();
      ctx.arc(point.x, point.y, pointRadius, 0, Math.PI * 2);
      ctx.setFillStyle('#f2f2f2');
      ctx.fill();
    });

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.setStrokeStyle('rgba(220, 223, 226, .26)');
    ctx.setLineWidth(1);
    ctx.stroke();
    ctx.draw();
  },

  drawRing(ring) {
    const ctx = this.ctx;
    let open = false;
    ring.forEach((coordinate) => {
      const point = this.project(coordinate[0], coordinate[1]);
      if (point.z <= 0.02) {
        open = false;
        return;
      }
      if (!open) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        open = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    if (open) {
      ctx.setStrokeStyle('rgba(176, 181, 187, .58)');
      ctx.setLineWidth(.7);
      ctx.stroke();
    }
  },

  handleTouchStart(event) {
    const touch = event.touches && event.touches[0];
    if (!touch) return;
    this.dragging = true;
    this.moved = false;
    this.lastTouch = touchPoint(touch);
    this.lastDistance = event.touches.length > 1 ? this.distance(event.touches) : 0;
  },

  handleTouchMove(event) {
    const touches = event.touches || [];
    if (!touches.length) return;
    if (touches.length > 1) {
      const distance = this.distance(touches);
      if (this.lastDistance) this.view.zoom = clamp(this.view.zoom * (distance / this.lastDistance), .62, 2.8);
      this.lastDistance = distance;
      this.renderFrame();
      return;
    }

    const touch = touches[0];
    const current = touchPoint(touch);
    if (!this.lastTouch) this.lastTouch = current;
    const dx = current.x - this.lastTouch.x;
    const dy = current.y - this.lastTouch.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) this.moved = true;
    const radius = Math.min(this.viewport.width, this.viewport.height) * 0.43 * this.view.zoom;
    this.view.lng -= dx / radius * 57;
    this.view.lat = clamp(this.view.lat + dy / radius * 57, -82, 82);
    this.view.lng = (this.view.lng + 540) % 360 - 180;
    this.lastTouch = current;
    this.renderFrame();
  },

  handleTouchEnd(event) {
    const touch = touchPoint((event.changedTouches && event.changedTouches[0]) || this.lastTouch);
    if (!this.moved && touch) this.pick(touch.x, touch.y);
    this.dragging = false;
    this.lastTouch = null;
    this.lastDistance = 0;
  },

  distance(touches) {
    const first = touchPoint(touches[0]);
    const second = touchPoint(touches[1]);
    const dx = first.x - second.x;
    const dy = first.y - second.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  pick(x, y) {
    let nearest = null;
    let nearestDistance = 28;
    offices.forEach((office) => {
      const point = this.project(office.lng, office.lat);
      if (point.z <= 0.04) return;
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < nearestDistance) {
        nearest = office;
        nearestDistance = distance;
      }
    });
    if (nearest) {
      this.focusOffice(nearest);
      return;
    }

    let countryMatch = null;
    let countryDistance = 42;
    countries.forEach((country) => {
      if (!Number.isFinite(country.labelLat) || !Number.isFinite(country.labelLng)) return;
      const point = this.project(country.labelLng, country.labelLat);
      if (point.z <= 0.04) return;
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < countryDistance) {
        countryMatch = country;
        countryDistance = distance;
      }
    });
    if (countryMatch) {
      this.focusCountry(countryMatch);
      return;
    }

    // Keep canvas taps useful as a backdrop dismiss action for open panels.
    if (this.data.detailOpen || this.data.searchOpen || this.data.legendOpen) {
      this.setData({ detailOpen: false, searchOpen: false, legendOpen: false });
    }
  },

  focusOffice(office) {
    this.view.lat = office.lat;
    this.view.lng = office.lng;
    this.view.zoom = 2.1;
    this.setData({
      detailOpen: true,
      searchOpen: false,
      legendOpen: false,
      selectedName: office.city,
      selectedDescription: `${office.country ? `${office.country} · ` : ''}${office.count} 家家族办公室`
    });
    this.renderFrame();
  },

  focusCountry(country) {
    const centerLat = Number.isFinite(country.labelLat) ? country.labelLat : (country.bounds.minLat + country.bounds.maxLat) / 2;
    const centerLng = Number.isFinite(country.labelLng) ? country.labelLng : (country.bounds.minLng + country.bounds.maxLng) / 2;
    const latSpan = country.bounds.maxLat - country.bounds.minLat;
    const lngSpan = country.bounds.maxLng - country.bounds.minLng;
    const span = Math.max(latSpan, lngSpan * Math.cos(centerLat * DEG), 6);
    this.view.lat = centerLat;
    this.view.lng = centerLng;
    this.view.zoom = clamp(90 / span, .75, 2.25);
    this.setData({
      detailOpen: true,
      searchOpen: false,
      legendOpen: false,
      selectedName: country.name,
      selectedDescription: '国家已选中'
    });
    this.renderFrame();
  },

  resetView() {
    this.view = { ...DEFAULT_VIEW };
    this.setData({ detailOpen: false, searchOpen: false, legendOpen: false, searchQuery: '' });
    this.renderFrame();
  },

  zoomIn() {
    this.view.zoom = clamp(this.view.zoom * 1.2, .62, 2.8);
    this.renderFrame();
  },

  zoomOut() {
    this.view.zoom = clamp(this.view.zoom / 1.2, .62, 2.8);
    this.renderFrame();
  },

  toggleSearch() {
    this.setData({ searchOpen: !this.data.searchOpen, legendOpen: false, detailOpen: false });
  },

  toggleLegend() {
    this.setData({ legendOpen: !this.data.legendOpen, searchOpen: false, detailOpen: false });
  },

  showMapInfo() {
    this.setData({
      detailOpen: true,
      searchOpen: false,
      legendOpen: false,
      selectedName: '地图说明',
      selectedDescription: '光点代表知识库中已解析坐标的家族办公室城市。'
    });
  },

  closeDetail() {
    this.resetView();
  },

  handleSearchInput(event) {
    this.setData({ searchQuery: event.detail.value });
  },

  submitSearch() {
    const query = this.data.searchQuery.trim().toLowerCase();
    if (!query) return;
    const office = offices.find((item) => `${item.city} ${item.country || ''}`.toLowerCase().includes(query));
    if (office) {
      this.focusOffice(office);
      return;
    }
    const country = countries.find((item) => item.name.toLowerCase().includes(query));
    if (country) this.focusCountry(country);
  }
});
