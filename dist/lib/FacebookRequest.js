"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsutil_1 = require("jsutil");
const axios_1 = require("axios");
const AsyncLib_1 = require("./AsyncLib");
class FacebookRequest extends AsyncLib_1.AsyncLib {
    static stringifyQuery(obj, prefix) {
        const pairs = [];
        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue;
            }
            const value = obj[key];
            const enkey = encodeURIComponent(key);
            let pair;
            if (typeof value === 'object') {
                pair = FacebookRequest.stringifyQuery(value, prefix ? prefix + '[' + enkey + ']' : enkey);
            }
            else {
                pair = (prefix ? prefix + '[' + enkey + ']' : enkey) + '=' + encodeURIComponent(value);
            }
            pairs.push(pair);
        }
        return pairs.join('&');
    }
    static getDomainValue(domain) {
        if (!domain) {
            return FacebookRequest.domains[0];
        }
        const value = FacebookRequest.domains[domain];
        if (!value) {
            throw new Error(`Invalid domain, possible values: ${FacebookRequest.domains.join()}`);
        }
        return value;
    }
    static generateContextLogging(fbDtsg) {
        let logging = '2';
        for (let i = 0; i < fbDtsg.length; i++) {
            logging += fbDtsg.charCodeAt(i);
        }
        return logging;
    }
    static parseResponse(response) {
        const length = response.length;
        return JSON.parse(response.substring(9, length));
    }
    static getCurrentContext() {
        return __awaiter(this, void 0, void 0, function* () {
            const { data: html } = yield axios_1.default.get(FacebookRequest.getDomainValue(FacebookRequest.Domain.default));
            const fbDtsg = jsutil_1.getFrom(html, 'name="fb_dtsg" value="', '"');
            const revision = jsutil_1.getFrom(html, 'revision":', ',');
            const userId = jsutil_1.getFrom(html, '"USER_ID":"', '"');
            return {
                __user: userId,
                __req: 0,
                __rev: parseInt(revision, 10),
                __a: 1,
                fb_dtsg: fbDtsg,
                logging: FacebookRequest.generateContextLogging(fbDtsg),
            };
        });
    }
    get(url, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign({ url, method: 'get' }, options));
        });
    }
    post(url, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.request(Object.assign({ url, method: 'post' }, options));
        });
    }
    getContext() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            return this.context;
        });
    }
    request(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.init();
            const { url, domain, form, data, qs, withContext, parseResponse, payload } = options;
            const domainValue = FacebookRequest.getDomainValue(domain);
            if (withContext && this.context) {
                this.context.__req++;
            }
            const fullData = Object.assign({}, withContext ? this.context : {}, data, form);
            const dataString = FacebookRequest.stringifyQuery(fullData);
            const ajaxOptions = Object.assign({}, options, {
                method: this._options.forceGet && options.worksWithGetMethod ? 'get' : options.method,
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                url,
                params: qs,
                baseURL: domainValue,
                data: new URLSearchParams(dataString),
            });
            if (options.graphql) {
                ajaxOptions.responseType = 'text';
            }
            let parsedResponse;
            const { data: result } = yield axios_1.default(ajaxOptions);
            if (options.graphql) {
                parsedResponse = result.split('\r\n').map(JSON.parse);
            }
            else {
                parsedResponse = parseResponse ? FacebookRequest.parseResponse(result) : result;
            }
            return payload ? parsedResponse.payload : parsedResponse;
        });
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.context) {
                this.context = yield FacebookRequest.getCurrentContext();
            }
            return this;
        });
    }
}
FacebookRequest.domains = [
    'https://www.facebook.com',
    'https://m.facebook.com',
    'https://www.messenger.com',
];
exports.FacebookRequest = FacebookRequest;
(function (FacebookRequest) {
    let Domain;
    (function (Domain) {
        Domain[Domain["default"] = 0] = "default";
        Domain[Domain["mobile"] = 1] = "mobile";
        Domain[Domain["messenger"] = 2] = "messenger";
    })(Domain = FacebookRequest.Domain || (FacebookRequest.Domain = {}));
})(FacebookRequest = exports.FacebookRequest || (exports.FacebookRequest = {}));
