Page({
  data: {
    mapUrl: 'https://komorgiaogiao.github.io/demo/index.html?embedded=1&ui=bottom-v3',
    searchOpen: false,
    searchQuery: '',
    detailOpen: false,
    selectedName: '',
    selectedDescription: ''
  },

  onLoad() {
    this.mapContext = tt.createWebViewContext('map-webview', this);
  },

  toggleSearch() {
    this.setData({ searchOpen: !this.data.searchOpen });
  },

  handleSearchInput(event) {
    this.setData({ searchQuery: event.detail.value });
  },

  submitSearch() {
    const query = this.data.searchQuery.trim();
    if (!query) return;

    this.mapContext.postMessage({
      data: { type: 'search', query }
    });
    this.setData({ searchOpen: false });
  },

  resetView() {
    this.mapContext.postMessage({
      data: { type: 'resetView' }
    });
    this.setData({ detailOpen: false });
  },

  closeDetail() {
    this.resetView();
  },

  showMapInfo() {
    this.setData({
      detailOpen: true,
      selectedName: '地图说明',
      selectedDescription: '光点代表知识库中已解析坐标的家族办公室城市。'
    });
  },

  handleWebMessage(event) {
    const messages = Array.isArray(event.detail.data) ? event.detail.data : [event.detail.data];
    const message = messages[messages.length - 1] || {};
    if (message.type !== 'regionSelected') return;

    this.setData({
      detailOpen: true,
      selectedName: message.name || '已选位置',
      selectedDescription: message.description || '已定位到地图位置'
    });
  }
})
