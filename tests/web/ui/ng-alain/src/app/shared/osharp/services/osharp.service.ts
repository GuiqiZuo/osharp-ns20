import { Injectable, Injector } from '@angular/core';
import { ListNode, AjaxResult, AjaxResultType } from '@shared/osharp/osharp.model';
import { NzMessageService, NzMessageDataOptions } from 'ng-zorro-antd';
import { Router } from '@angular/router';
import { Buffer } from "buffer";
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { List } from "linqts";
import { CacheService } from '@shared/osharp/cache/cache.service';

@Injectable()
export class OsharpService {

  public msgSrv: NzMessageService;
  private router: Router;
  private http: HttpClient;

  constructor(
    injector: Injector
  ) {
    this.msgSrv = injector.get(NzMessageService);
    this.router = injector.get(Router);
    this.http = injector.get(HttpClient);
  }

  // #region 工具方法

  /**URL编码 */
  urlEncode(url: string): string {
    return encodeURIComponent(url);
  }
  /**URL解码 */
  urlDecode(url: string): string {
    return decodeURIComponent(url);
  }

  /**Base64字符串解码 */
  fromBase64(base64: string): string {
    return new Buffer(base64, 'base64').toString();
  }
  /**Base64字符串编码 */
  toBase64(str: string): string {
    return new Buffer(str).toString('base64');
  }
  /**获取URL中Hash串中的查询参数值 */
  getHashURLSearchParams(url: string, name: string): string {
    if (url.indexOf("#") >= 0) {
      url = this.subStr(url, "#");
    }
    if (url.indexOf("?") >= 0) {
      url = this.subStr(url, "?");
    }
    const params = new URLSearchParams(url);
    return params.get(name);
  }
  /**提供首尾字符串截取中间的字符串 */
  subStr(str: string, start: string = null, end: string = null): string {
    let startIndex = 0, endIndex = str.length;
    if (start) {
      startIndex = str.indexOf(start) + start.length;
    }
    if (end) {
      endIndex = str.indexOf(end);
    }
    return str.substr(startIndex, endIndex - startIndex);
  }
  /**值转文字 */
  valueToText(id: number, array: Array<ListNode>, defaultText: string = null) {
    let text = defaultText == null ? id : defaultText;
    array.forEach(item => {
      if (item.id == id) {
        text = item.text;
        return false;
      }
      return true;
    });
    return text;
  }
  /**展开集合拼接字符串 */
  expandAndToString(array: Array<any>, separator: string = ',') {
    let result = '';
    if (!array || !array.length) {
      return result;
    }
    array.forEach(item => {
      result = result + item.toString() + separator;
    });
    return result.substr(0, result.length - separator.length);
  }
  /** 下载数据 */
  download(filename: string, content: string) {
    const urlObject = window.URL;
    const blob = new Blob([content]);
    const saveLink = document.createElement("a");
    saveLink.href = urlObject.createObjectURL(blob);
    saveLink.download = filename;
    const ev = document.createEvent("MouseEvents");
    ev.initMouseEvent(
      "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
    );
    saveLink.dispatchEvent(ev);
  }
  /**打开Email的网站 */
  openMailSite(email: string) {
    let host = this.subStr(email, "@");
    let url = `http://mail.${host}`;
    window.open(url);
  }

  ajaxResult(res, onSuccess?, onFail?) {
    if (!res || !res.Type) {
      return;
    }
    const result = res as AjaxResult;
    const type = result.Type;
    const content = result.Content;
    switch (type) {
      case AjaxResultType.Info:
        this.info(content);
        break;
      case AjaxResultType.NoFound:
        this.router.navigateByUrl("/nofound");
        break;
      case AjaxResultType.UnAuth:
        this.warning("用户未登录或登录已失效");
        this.router.navigateByUrl("/identity/login");
        break;
      case AjaxResultType.Success:
        this.success(content);
        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
        break;
      default:
        this.error(content);
        if (onFail && typeof onFail === "function") {
          onFail();
        }
        break;
    }
  }
  /**处理Ajax错误 */
  ajaxError(xhr) {
    switch (xhr.status) {
      case 401:
        this.warning("用户未登录或登录已失效");
        this.router.navigateByUrl("/identity/login");
        break;
      case 404:
        this.router.navigateByUrl("/nofound");
        break;
      default:
        this.error(`发生错误：${xhr.status}: ${xhr.statusText}`);
        break;
    }
  }
  /**获取树节点集合 */
  getTreeNodes(root: any, array: Array<any>) {
    array.push(root);
    if (root.hasChildren) {
      for (let i = 0; i < root.Items.length; i++) {
        const item = root.Items[i];
        this.getTreeNodes(item, array);
      }
    }
  }

  /**检查URL的功能权限 */
  checkUrlAuth(url: string): Observable<boolean> {
    if (!url.startsWith("https:") && !url.startsWith("http") && !url.startsWith("/")) {
      url = `/${url}`;
    }
    url = this.urlEncode(url);
    console.log(url);
    return this.http.get<boolean>("/api/security/CheckUrlAuth?url=" + url);
  }

  // #endregion

  // #region 消息方法

  private msgOptions: NzMessageDataOptions = { nzDuration: 1000 * 3, nzAnimate: true, nzPauseOnHover: true };

  loading(msg) {
    return this.msgSrv.loading(msg, this.msgOptions);
  }
  success(msg) {
    return this.msgSrv.success(msg, this.msgOptions);
  }
  info(msg) {
    return this.msgSrv.info(msg, this.msgOptions);
  }
  warning(msg) {
    return this.msgSrv.warning(msg, this.msgOptions);
  }
  error(msg) {
    return this.msgSrv.error(msg, { nzDuration: 1000 * 6, nzAnimate: true, nzPauseOnHover: true });
  }

  // #endregion

  // #region 静态数据

  data = {
    accessType: [{ id: 0, text: "匿名访问" }, { id: 1, text: "登录访问" }, { id: 2, text: "角色访问" }],
    stringFilterable: { operators: { string: { contains: "包含", eq: "等于", neq: "不等于", startswith: "开始于", endswith: "结束于", doesnotcontain: "不包含" } } }
  };

  // #endregion
}

//#region 组件基类

export abstract class ComponentBase {
  private cache: CacheService;

  /**权限字典，以模块代码为键，是否有权限为值 */
  public authDict: { [key: string]: boolean; } = null;

  constructor(injector: Injector) {
    this.cache = injector.get(CacheService);
  }

  /**重写以返回当前模块的位置，即上级模块的路径，如Root,Root.Admin,Root.Admin.Identity */
  abstract Position(): string;

  async checkAuth() {
    if (this.authDict == null) {
      return;
    }
    let position = this.Position();
    let codes = await this.cache.get<string[]>('/api/security/getauthinfo', { expire: 1 }).toPromise();
    if (!codes) {
      return;
    }
    let list = new List(codes);
    for (const key in this.authDict) {
      if (this.authDict.hasOwnProperty(key)) {
        let path = `${position}.${key}`;
        this.authDict[key] = list.Contains(path);
      }
    }
  }
}

//#endregion
