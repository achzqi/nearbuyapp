const UrlParser = {
  parseActiveUrlWithCombiner() {
    const url = window.location.hash.slice(1).toLowerCase() || "/";
    return url;
  },
};

export default UrlParser;
