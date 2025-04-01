import axios from 'axios';

axios.interceptors.response.use(response => {
    const etag = response.headers.etag;
    if (etag) {
        const etagStore = JSON.parse(localStorage.getItem('etags') || '{}');
        etagStore[response.config.url] = etag;
        localStorage.setItem('etag', JSON.stringify(etagStore));
    }
    return response;
});

axios.interceptors.request.use(request => {
    const etagStore = JSON.parse(localStorage.getItem('etag') || '{}');
    const etag = etagStore[request.url];
    if (etag) {
        request.headers['If-None-Match'] = etag;
    }
    return request;
});

export default axios;