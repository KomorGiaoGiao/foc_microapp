Page({
  data: {
    mapUrl: 'https://komorgiaogiao.github.io/demo/index.html?standalone=1'
  },

  onLoad() {
    this.mapContext = tt.createWebViewContext('map-webview', this);
  }
});
