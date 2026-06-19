import { createRequire as e } from "node:module";
import { BrowserWindow as t, app as n, globalShortcut as r, ipcMain as i } from "electron";
import a from "node:path";
import o from "node:fs";
import { fileURLToPath as s } from "node:url";
//#region \0rolldown/runtime.js
var c = Object.create, l = Object.defineProperty, u = Object.getOwnPropertyDescriptor, d = Object.getOwnPropertyNames, ee = Object.getPrototypeOf, f = Object.prototype.hasOwnProperty, te = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), e = null), t.exports), p = (e, t, n, r) => {
	if (t && typeof t == "object" || typeof t == "function") for (var i = d(t), a = 0, o = i.length, s; a < o; a++) s = i[a], !f.call(e, s) && s !== n && l(e, s, {
		get: ((e) => t[e]).bind(null, s),
		enumerable: !(r = u(t, s)) || r.enumerable
	});
	return e;
}, ne = (e, t, n) => (n = e == null ? {} : c(ee(e)), p(t || !e || !e.__esModule ? l(n, "default", {
	value: e,
	enumerable: !0
}) : n, e)), re = /* @__PURE__ */ e(import.meta.url), m = /* @__PURE__ */ ne((/* @__PURE__ */ te(((e, t) => {
	var n = void 0, r = function(e) {
		return n || (n = new Promise(function(n, r) {
			var i = e === void 0 ? {} : e, a = i.onAbort;
			i.onAbort = function(e) {
				r(Error(e)), a && a(e);
			}, i.postRun = i.postRun || [], i.postRun.push(function() {
				n(i);
			}), t = void 0;
			var o;
			o ||= i === void 0 ? {} : i;
			var s = !!globalThis.window, c = !!globalThis.WorkerGlobalScope, l = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
			o.onRuntimeInitialized = function() {
				function e(e, t) {
					switch (typeof t) {
						case "boolean":
							pe(e, +!!t);
							break;
						case "number":
							de(e, t);
							break;
						case "string":
							A(e, t, -1, -1);
							break;
						case "object":
							if (t === null) fe(e);
							else if (t.length != null) {
								var n = Mt(t.length);
								b.set(t, n), j(e, n, t.length, -1), Nt(n);
							} else N(e, "Wrong API use : tried to return a value of an unknown type (" + t + ").", -1);
							break;
						default: fe(e);
					}
				}
				function t(e, t) {
					for (var n = [], r = 0; r < e; r += 1) {
						var i = M(t + 4 * r, "i32"), a = oe(i);
						if (a === 1 || a === 2) i = ue(i);
						else if (a === 3) i = ce(i);
						else if (a === 4) {
							a = i, i = se(a), a = le(a);
							for (var o = new Uint8Array(i), s = 0; s < i; s += 1) o[s] = b[a + s];
							i = o;
						} else i = null;
						n.push(i);
					}
					return n;
				}
				function n(e, t) {
					this.Qa = e, this.db = t, this.Oa = 1, this.mb = [];
				}
				function r(e, t) {
					if (this.db = t, this.fb = Et(e), this.fb === null) throw Error("Unable to allocate memory for the SQL string");
					this.lb = this.fb, this.$a = this.sb = null;
				}
				function i(e) {
					if (this.filename = "dbfile_" + (4294967295 * Math.random() >>> 0), e != null) {
						var t = this.filename, n = "/", r = t;
						if (n && (n = typeof n == "string" ? n : ze(n), r = t ? _e(n + "/" + t) : n), t = Ae(!0, !0), r = $e(r, t), e) {
							if (typeof e == "string") {
								n = Array(e.length);
								for (var i = 0, o = e.length; i < o; ++i) n[i] = e.charCodeAt(i);
								e = n;
							}
							ot(r, t | 146), n = K(r, 577), dt(n, e, 0, e.length, 0), ct(n), ot(r, t);
						}
					}
					this.handleError(c(this.filename, a)), this.db = M(a, "i32"), ge(this.db), this.gb = {}, this.Sa = {};
				}
				var a = Q(4), s = o.cwrap, c = s("sqlite3_open", "number", ["string", "number"]), l = s("sqlite3_close_v2", "number", ["number"]), u = s("sqlite3_exec", "number", [
					"number",
					"string",
					"number",
					"number",
					"number"
				]), d = s("sqlite3_changes", "number", ["number"]), ee = s("sqlite3_prepare_v2", "number", [
					"number",
					"string",
					"number",
					"number",
					"number"
				]), f = s("sqlite3_sql", "string", ["number"]), te = s("sqlite3_normalized_sql", "string", ["number"]), p = s("sqlite3_prepare_v2", "number", [
					"number",
					"number",
					"number",
					"number",
					"number"
				]), ne = s("sqlite3_bind_text", "number", [
					"number",
					"number",
					"number",
					"number",
					"number"
				]), re = s("sqlite3_bind_blob", "number", [
					"number",
					"number",
					"number",
					"number",
					"number"
				]), m = s("sqlite3_bind_double", "number", [
					"number",
					"number",
					"number"
				]), h = s("sqlite3_bind_int", "number", [
					"number",
					"number",
					"number"
				]), g = s("sqlite3_bind_parameter_index", "number", ["number", "string"]), _ = s("sqlite3_step", "number", ["number"]), v = s("sqlite3_errmsg", "string", ["number"]), y = s("sqlite3_column_count", "number", ["number"]), x = s("sqlite3_data_count", "number", ["number"]), S = s("sqlite3_column_double", "number", ["number", "number"]), C = s("sqlite3_column_text", "string", ["number", "number"]), w = s("sqlite3_column_blob", "number", ["number", "number"]), ie = s("sqlite3_column_bytes", "number", ["number", "number"]), T = s("sqlite3_column_type", "number", ["number", "number"]), E = s("sqlite3_column_name", "string", ["number", "number"]), D = s("sqlite3_reset", "number", ["number"]), O = s("sqlite3_clear_bindings", "number", ["number"]), k = s("sqlite3_finalize", "number", ["number"]), ae = s("sqlite3_create_function_v2", "number", "number string number number number number number number number".split(" ")), oe = s("sqlite3_value_type", "number", ["number"]), se = s("sqlite3_value_bytes", "number", ["number"]), ce = s("sqlite3_value_text", "string", ["number"]), le = s("sqlite3_value_blob", "number", ["number"]), ue = s("sqlite3_value_double", "number", ["number"]), de = s("sqlite3_result_double", "", ["number", "number"]), fe = s("sqlite3_result_null", "", ["number"]), A = s("sqlite3_result_text", "", [
					"number",
					"string",
					"number",
					"number"
				]), j = s("sqlite3_result_blob", "", [
					"number",
					"number",
					"number",
					"number"
				]), pe = s("sqlite3_result_int", "", ["number", "number"]), N = s("sqlite3_result_error", "", [
					"number",
					"string",
					"number"
				]), he = s("sqlite3_aggregate_context", "number", ["number", "number"]), ge = s("RegisterExtensionFunctions", "number", ["number"]), ve = s("sqlite3_update_hook", "number", [
					"number",
					"number",
					"number"
				]);
				n.prototype.bind = function(e) {
					if (!this.Qa) throw "Statement closed";
					return this.reset(), Array.isArray(e) ? this.Gb(e) : typeof e == "object" && e ? this.Hb(e) : !0;
				}, n.prototype.step = function() {
					if (!this.Qa) throw "Statement closed";
					this.Oa = 1;
					var e = _(this.Qa);
					switch (e) {
						case 100: return !0;
						case 101: return !1;
						default: throw this.db.handleError(e);
					}
				}, n.prototype.Ab = function(e) {
					return e ?? (e = this.Oa, this.Oa += 1), S(this.Qa, e);
				}, n.prototype.Ob = function(e) {
					if (e ?? (e = this.Oa, this.Oa += 1), e = C(this.Qa, e), typeof BigInt != "function") throw Error("BigInt is not supported");
					return BigInt(e);
				}, n.prototype.Tb = function(e) {
					return e ?? (e = this.Oa, this.Oa += 1), C(this.Qa, e);
				}, n.prototype.getBlob = function(e) {
					e ?? (e = this.Oa, this.Oa += 1);
					var t = ie(this.Qa, e);
					e = w(this.Qa, e);
					for (var n = new Uint8Array(t), r = 0; r < t; r += 1) n[r] = b[e + r];
					return n;
				}, n.prototype.get = function(e, t) {
					t ||= {}, e != null && this.bind(e) && this.step(), e = [];
					for (var n = x(this.Qa), r = 0; r < n; r += 1) switch (T(this.Qa, r)) {
						case 1:
							var i = t.useBigInt ? this.Ob(r) : this.Ab(r);
							e.push(i);
							break;
						case 2:
							e.push(this.Ab(r));
							break;
						case 3:
							e.push(this.Tb(r));
							break;
						case 4:
							e.push(this.getBlob(r));
							break;
						default: e.push(null);
					}
					return e;
				}, n.prototype.qb = function() {
					for (var e = [], t = y(this.Qa), n = 0; n < t; n += 1) e.push(E(this.Qa, n));
					return e;
				}, n.prototype.zb = function(e, t) {
					e = this.get(e, t), t = this.qb();
					for (var n = {}, r = 0; r < t.length; r += 1) n[t[r]] = e[r];
					return n;
				}, n.prototype.Sb = function() {
					return f(this.Qa);
				}, n.prototype.Pb = function() {
					return te(this.Qa);
				}, n.prototype.run = function(e) {
					return e != null && this.bind(e), this.step(), this.reset();
				}, n.prototype.wb = function(e, t) {
					t ?? (t = this.Oa, this.Oa += 1), e = Et(e), this.mb.push(e), this.db.handleError(ne(this.Qa, t, e, -1, 0));
				}, n.prototype.Fb = function(e, t) {
					t ?? (t = this.Oa, this.Oa += 1);
					var n = Mt(e.length);
					b.set(e, n), this.mb.push(n), this.db.handleError(re(this.Qa, t, n, e.length, 0));
				}, n.prototype.vb = function(e, t) {
					t ?? (t = this.Oa, this.Oa += 1), this.db.handleError((e === (e | 0) ? h : m)(this.Qa, t, e));
				}, n.prototype.Ib = function(e) {
					e ?? (e = this.Oa, this.Oa += 1), re(this.Qa, e, 0, 0, 0);
				}, n.prototype.xb = function(e, t) {
					switch (t ?? (t = this.Oa, this.Oa += 1), typeof e) {
						case "string":
							this.wb(e, t);
							return;
						case "number":
							this.vb(e, t);
							return;
						case "bigint":
							this.wb(e.toString(), t);
							return;
						case "boolean":
							this.vb(e + 0, t);
							return;
						case "object":
							if (e === null) {
								this.Ib(t);
								return;
							}
							if (e.length != null) {
								this.Fb(e, t);
								return;
							}
					}
					throw "Wrong API use : tried to bind a value of an unknown type (" + e + ").";
				}, n.prototype.Hb = function(e) {
					var t = this;
					return Object.keys(e).forEach(function(n) {
						var r = g(t.Qa, n);
						r !== 0 && t.xb(e[n], r);
					}), !0;
				}, n.prototype.Gb = function(e) {
					for (var t = 0; t < e.length; t += 1) this.xb(e[t], t + 1);
					return !0;
				}, n.prototype.reset = function() {
					return this.freemem(), O(this.Qa) === 0 && D(this.Qa) === 0;
				}, n.prototype.freemem = function() {
					for (var e; (e = this.mb.pop()) !== void 0;) Nt(e);
				}, n.prototype.Ya = function() {
					this.freemem();
					var e = k(this.Qa) === 0;
					return delete this.db.gb[this.Qa], this.Qa = 0, e;
				}, r.prototype.next = function() {
					if (this.fb === null) return { done: !0 };
					if (this.$a !== null && (this.$a.Ya(), this.$a = null), !this.db.db) throw this.ob(), Error("Database closed");
					var e = Lt(), t = Q(4);
					me(a), me(t);
					try {
						this.db.handleError(p(this.db.db, this.lb, -1, a, t)), this.lb = M(t, "i32");
						var r = M(a, "i32");
						return r === 0 ? (this.ob(), { done: !0 }) : (this.$a = new n(r, this.db), this.db.gb[r] = this.$a, {
							value: this.$a,
							done: !1
						});
					} catch (e) {
						throw this.sb = P(this.lb), this.ob(), e;
					} finally {
						It(e);
					}
				}, r.prototype.ob = function() {
					Nt(this.fb), this.fb = null;
				}, r.prototype.Qb = function() {
					return this.sb === null ? P(this.lb) : this.sb;
				}, typeof Symbol == "function" && typeof Symbol.iterator == "symbol" && (r.prototype[Symbol.iterator] = function() {
					return this;
				}), i.prototype.run = function(e, t) {
					if (!this.db) throw "Database closed";
					if (t) {
						e = this.tb(e, t);
						try {
							e.step();
						} finally {
							e.Ya();
						}
					} else this.handleError(u(this.db, e, 0, 0, a));
					return this;
				}, i.prototype.exec = function(e, t, r) {
					if (!this.db) throw "Database closed";
					var i = null, o = null, s = null;
					try {
						s = o = Et(e);
						var c = Q(4);
						for (e = []; M(s, "i8") !== 0;) {
							me(a), me(c), this.handleError(p(this.db, s, -1, a, c));
							var l = M(a, "i32");
							if (s = M(c, "i32"), l !== 0) {
								var u = null;
								for (i = new n(l, this), t != null && i.bind(t); i.step();) u === null && (u = {
									columns: i.qb(),
									values: []
								}, e.push(u)), u.values.push(i.get(null, r));
								i.Ya();
							}
						}
						return e;
					} catch (e) {
						throw i && i.Ya(), e;
					} finally {
						o && Nt(o);
					}
				}, i.prototype.Mb = function(e, t, n, r, i) {
					typeof t == "function" && (r = n, n = t, t = void 0), e = this.tb(e, t);
					try {
						for (; e.step();) n(e.zb(null, i));
					} finally {
						e.Ya();
					}
					if (typeof r == "function") return r();
				}, i.prototype.tb = function(e, t) {
					if (me(a), this.handleError(ee(this.db, e, -1, a, 0)), e = M(a, "i32"), e === 0) throw "Nothing to prepare";
					var r = new n(e, this);
					return t != null && r.bind(t), this.gb[e] = r;
				}, i.prototype.Ub = function(e) {
					return new r(e, this);
				}, i.prototype.Nb = function() {
					Object.values(this.gb).forEach(function(e) {
						e.Ya();
					}), Object.values(this.Sa).forEach(Z), this.Sa = {}, this.handleError(l(this.db));
					var e = ft(this.filename);
					return this.handleError(c(this.filename, a)), this.db = M(a, "i32"), ge(this.db), e;
				}, i.prototype.close = function() {
					this.db !== null && (Object.values(this.gb).forEach(function(e) {
						e.Ya();
					}), Object.values(this.Sa).forEach(Z), this.Sa = {}, this.Za &&= (Z(this.Za), void 0), this.handleError(l(this.db)), rt("/" + this.filename), this.db = null);
				}, i.prototype.handleError = function(e) {
					if (e === 0) return null;
					throw e = v(this.db), Error(e);
				}, i.prototype.Rb = function() {
					return d(this.db);
				}, i.prototype.Kb = function(n, r) {
					Object.prototype.hasOwnProperty.call(this.Sa, n) && (Z(this.Sa[n]), delete this.Sa[n]);
					var i = jt(function(n, i, a) {
						i = t(i, a);
						try {
							var o = r.apply(null, i);
						} catch (e) {
							N(n, e, -1);
							return;
						}
						e(n, o);
					}, "viii");
					return this.Sa[n] = i, this.handleError(ae(this.db, n, r.length, 1, 0, i, 0, 0, 0)), this;
				}, i.prototype.Jb = function(n, r) {
					var i = r.init || function() {
						return null;
					}, a = r.finalize || function(e) {
						return e;
					}, o = r.step;
					if (!o) throw "An aggregate function must have a step function in " + n;
					var s = {};
					Object.hasOwnProperty.call(this.Sa, n) && (Z(this.Sa[n]), delete this.Sa[n]), r = n + "__finalize", Object.hasOwnProperty.call(this.Sa, r) && (Z(this.Sa[r]), delete this.Sa[r]);
					var c = jt(function(e, n, r) {
						var a = he(e, 1);
						Object.hasOwnProperty.call(s, a) || (s[a] = i()), n = t(n, r), n = [s[a]].concat(n);
						try {
							s[a] = o.apply(null, n);
						} catch (t) {
							delete s[a], N(e, t, -1);
						}
					}, "viii"), l = jt(function(t) {
						var n = he(t, 1);
						try {
							var r = a(s[n]);
						} catch (e) {
							delete s[n], N(t, e, -1);
							return;
						}
						e(t, r), delete s[n];
					}, "vi");
					return this.Sa[n] = c, this.Sa[r] = l, this.handleError(ae(this.db, n, o.length - 1, 1, 0, 0, c, l, 0)), this;
				}, i.prototype.Zb = function(e) {
					return this.Za &&= (ve(this.db, 0, 0), Z(this.Za), void 0), e ? (this.Za = jt(function(t, n, r, i, a) {
						switch (n) {
							case 18:
								t = "insert";
								break;
							case 23:
								t = "update";
								break;
							case 9:
								t = "delete";
								break;
							default: throw "unknown operationCode in updateHook callback: " + n;
						}
						if (r = P(r), i = P(i), a > 2 ** 53 - 1) throw "rowId too big to fit inside a Number";
						e(t, r, i, Number(a));
					}, "viiiij"), ve(this.db, this.Za, 0), this) : this;
				}, n.prototype.bind = n.prototype.bind, n.prototype.step = n.prototype.step, n.prototype.get = n.prototype.get, n.prototype.getColumnNames = n.prototype.qb, n.prototype.getAsObject = n.prototype.zb, n.prototype.getSQL = n.prototype.Sb, n.prototype.getNormalizedSQL = n.prototype.Pb, n.prototype.run = n.prototype.run, n.prototype.reset = n.prototype.reset, n.prototype.freemem = n.prototype.freemem, n.prototype.free = n.prototype.Ya, r.prototype.next = r.prototype.next, r.prototype.getRemainingSQL = r.prototype.Qb, i.prototype.run = i.prototype.run, i.prototype.exec = i.prototype.exec, i.prototype.each = i.prototype.Mb, i.prototype.prepare = i.prototype.tb, i.prototype.iterateStatements = i.prototype.Ub, i.prototype.export = i.prototype.Nb, i.prototype.close = i.prototype.close, i.prototype.handleError = i.prototype.handleError, i.prototype.getRowsModified = i.prototype.Rb, i.prototype.create_function = i.prototype.Kb, i.prototype.create_aggregate = i.prototype.Jb, i.prototype.updateHook = i.prototype.Zb, o.Database = i;
			};
			var u = "./this.program", d = (e, t) => {
				throw t;
			}, ee = globalThis.document?.currentScript?.src;
			typeof __filename < "u" ? ee = __filename : c && (ee = self.location.href);
			var f = "", te, p;
			if (l) {
				var ne = re("node:fs");
				f = __dirname + "/", p = (e) => (e = y(e) ? new URL(e) : e, ne.readFileSync(e)), te = async (e) => (e = y(e) ? new URL(e) : e, ne.readFileSync(e, void 0)), 1 < process.argv.length && (u = process.argv[1].replace(/\\/g, "/")), process.argv.slice(2), t !== void 0 && (t.exports = o), d = (e, t) => {
					throw process.exitCode = e, t;
				};
			} else if (s || c) {
				try {
					f = new URL(".", ee).href;
				} catch {}
				c && (p = (e) => {
					var t = new XMLHttpRequest();
					return t.open("GET", e, !1), t.responseType = "arraybuffer", t.send(null), new Uint8Array(t.response);
				}), te = async (e) => {
					if (y(e)) return new Promise((t, n) => {
						var r = new XMLHttpRequest();
						r.open("GET", e, !0), r.responseType = "arraybuffer", r.onload = () => {
							r.status == 200 || r.status == 0 && r.response ? t(r.response) : n(r.status);
						}, r.onerror = n, r.send(null);
					});
					var t = await fetch(e, { credentials: "same-origin" });
					if (t.ok) return t.arrayBuffer();
					throw Error(t.status + " : " + t.url);
				};
			}
			var m = console.log.bind(console), h = console.error.bind(console), g, _ = !1, v, y = (e) => e.startsWith("file://"), b, x, S, C, w, ie, T, E;
			function D() {
				var e = Rt.buffer;
				b = new Int8Array(e), S = new Int16Array(e), x = new Uint8Array(e), new Uint16Array(e), C = new Int32Array(e), w = new Uint32Array(e), ie = new Float32Array(e), T = new Float64Array(e), E = new BigInt64Array(e), new BigUint64Array(e);
			}
			function O(e) {
				throw o.onAbort?.(e), e = "Aborted(" + e + ")", h(e), _ = !0, new WebAssembly.RuntimeError(e + ". Build with -sASSERTIONS for more info.");
			}
			var k;
			async function ae(e) {
				if (!g) try {
					var t = await te(e);
					return new Uint8Array(t);
				} catch {}
				if (e == k && g) e = new Uint8Array(g);
				else if (p) e = p(e);
				else throw "both async and sync fetching of the wasm failed";
				return e;
			}
			async function oe(e, t) {
				try {
					var n = await ae(e);
					return await WebAssembly.instantiate(n, t);
				} catch (e) {
					h(`failed to asynchronously prepare wasm: ${e}`), O(e);
				}
			}
			async function se(e) {
				var t = k;
				if (!g && !y(t) && !l) try {
					var n = fetch(t, { credentials: "same-origin" });
					return await WebAssembly.instantiateStreaming(n, e);
				} catch (e) {
					h(`wasm streaming compile failed: ${e}`), h("falling back to ArrayBuffer instantiation");
				}
				return oe(t, e);
			}
			class ce {
				name = "ExitStatus";
				constructor(e) {
					this.message = `Program terminated with exit(${e})`, this.status = e;
				}
			}
			var le = (e) => {
				for (; 0 < e.length;) e.shift()(o);
			}, ue = [], de = [], fe = () => {
				var e = o.preRun.shift();
				de.push(e);
			}, A = 0, j = null;
			function M(e, t = "i8") {
				switch (t.endsWith("*") && (t = "*"), t) {
					case "i1": return b[e];
					case "i8": return b[e];
					case "i16": return S[e >> 1];
					case "i32": return C[e >> 2];
					case "i64": return E[e >> 3];
					case "float": return ie[e >> 2];
					case "double": return T[e >> 3];
					case "*": return w[e >> 2];
					default: O(`invalid type for getValue: ${t}`);
				}
			}
			var pe = !0;
			function me(e) {
				var t = "i32";
				switch (t.endsWith("*") && (t = "*"), t) {
					case "i1":
						b[e] = 0;
						break;
					case "i8":
						b[e] = 0;
						break;
					case "i16":
						S[e >> 1] = 0;
						break;
					case "i32":
						C[e >> 2] = 0;
						break;
					case "i64":
						E[e >> 3] = BigInt(0);
						break;
					case "float":
						ie[e >> 2] = 0;
						break;
					case "double":
						T[e >> 3] = 0;
						break;
					case "*":
						w[e >> 2] = 0;
						break;
					default: O(`invalid type for setValue: ${t}`);
				}
			}
			var N = new TextDecoder(), he = (e, t, n, r) => {
				if (n = t + n, r) return n;
				for (; e[t] && !(t >= n);) ++t;
				return t;
			}, P = (e, t, n) => e ? N.decode(x.subarray(e, he(x, e, t, n))) : "", ge = (e, t) => {
				for (var n = 0, r = e.length - 1; 0 <= r; r--) {
					var i = e[r];
					i === "." ? e.splice(r, 1) : i === ".." ? (e.splice(r, 1), n++) : n && (e.splice(r, 1), n--);
				}
				if (t) for (; n; n--) e.unshift("..");
				return e;
			}, _e = (e) => {
				var t = e.charAt(0) === "/", n = e.slice(-1) === "/";
				return (e = ge(e.split("/").filter((e) => !!e), !t).join("/")) || t || (e = "."), e && n && (e += "/"), (t ? "/" : "") + e;
			}, ve = (e) => {
				var t = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1);
				return e = t[0], t = t[1], !e && !t ? "." : (t &&= t.slice(0, -1), e + t);
			}, ye = (e) => e && e.match(/([^\/]+|\/)\/*$/)[1], be = () => {
				if (l) {
					var e = re("node:crypto");
					return (t) => e.randomFillSync(t);
				}
				return (e) => crypto.getRandomValues(e);
			}, xe = (e) => {
				(xe = be())(e);
			}, Se = (...e) => {
				for (var t = "", n = !1, r = e.length - 1; -1 <= r && !n; r--) {
					if (n = 0 <= r ? e[r] : "/", typeof n != "string") throw TypeError("Arguments to path.resolve must be strings");
					if (!n) return "";
					t = n + "/" + t, n = n.charAt(0) === "/";
				}
				return t = ge(t.split("/").filter((e) => !!e), !n).join("/"), (n ? "/" : "") + t || ".";
			}, Ce = (e) => {
				var t = he(e, 0);
				return N.decode(e.buffer ? e.subarray(0, t) : new Uint8Array(e.slice(0, t)));
			}, we = [], F = (e) => {
				for (var t = 0, n = 0; n < e.length; ++n) {
					var r = e.charCodeAt(n);
					127 >= r ? t++ : 2047 >= r ? t += 2 : 55296 <= r && 57343 >= r ? (t += 4, ++n) : t += 3;
				}
				return t;
			}, I = (e, t, n, r) => {
				if (!(0 < r)) return 0;
				var i = n;
				r = n + r - 1;
				for (var a = 0; a < e.length; ++a) {
					var o = e.codePointAt(a);
					if (127 >= o) {
						if (n >= r) break;
						t[n++] = o;
					} else if (2047 >= o) {
						if (n + 1 >= r) break;
						t[n++] = 192 | o >> 6, t[n++] = 128 | o & 63;
					} else if (65535 >= o) {
						if (n + 2 >= r) break;
						t[n++] = 224 | o >> 12, t[n++] = 128 | o >> 6 & 63, t[n++] = 128 | o & 63;
					} else {
						if (n + 3 >= r) break;
						t[n++] = 240 | o >> 18, t[n++] = 128 | o >> 12 & 63, t[n++] = 128 | o >> 6 & 63, t[n++] = 128 | o & 63, a++;
					}
				}
				return t[n] = 0, n - i;
			}, Te = [];
			function Ee(e, t) {
				Te[e] = {
					input: [],
					output: [],
					eb: t
				}, Xe(e, De);
			}
			var De = {
				open(e) {
					var t = Te[e.node.rdev];
					if (!t) throw new z(43);
					e.tty = t, e.seekable = !1;
				},
				close(e) {
					e.tty.eb.fsync(e.tty);
				},
				fsync(e) {
					e.tty.eb.fsync(e.tty);
				},
				read(e, t, n, r) {
					if (!e.tty || !e.tty.eb.Bb) throw new z(60);
					for (var i = 0, a = 0; a < r; a++) {
						try {
							var o = e.tty.eb.Bb(e.tty);
						} catch {
							throw new z(29);
						}
						if (o === void 0 && i === 0) throw new z(6);
						if (o == null) break;
						i++, t[n + a] = o;
					}
					return i && (e.node.atime = Date.now()), i;
				},
				write(e, t, n, r) {
					if (!e.tty || !e.tty.eb.ub) throw new z(60);
					try {
						for (var i = 0; i < r; i++) e.tty.eb.ub(e.tty, t[n + i]);
					} catch {
						throw new z(29);
					}
					return r && (e.node.mtime = e.node.ctime = Date.now()), i;
				}
			}, Oe = {
				Bb() {
					a: {
						if (!we.length) {
							var e = null;
							if (l) {
								var t = Buffer.alloc(256), n = 0, r = process.stdin.fd;
								try {
									n = ne.readSync(r, t, 0, 256);
								} catch (e) {
									if (e.toString().includes("EOF")) n = 0;
									else throw e;
								}
								0 < n && (e = t.slice(0, n).toString("utf-8"));
							} else globalThis.window?.prompt && (e = window.prompt("Input: "), e !== null && (e += "\n"));
							if (!e) {
								e = null;
								break a;
							}
							t = Array(F(e) + 1), e = I(e, t, 0, t.length), t.length = e, we = t;
						}
						e = we.shift();
					}
					return e;
				},
				ub(e, t) {
					t === null || t === 10 ? (m(Ce(e.output)), e.output = []) : t != 0 && e.output.push(t);
				},
				fsync(e) {
					0 < e.output?.length && (m(Ce(e.output)), e.output = []);
				},
				hc() {
					return {
						bc: 25856,
						dc: 5,
						ac: 191,
						cc: 35387,
						$b: [
							3,
							28,
							127,
							21,
							4,
							0,
							1,
							0,
							17,
							19,
							26,
							0,
							18,
							15,
							23,
							22,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0,
							0
						]
					};
				},
				ic() {
					return 0;
				},
				jc() {
					return [24, 80];
				}
			}, ke = {
				ub(e, t) {
					t === null || t === 10 ? (h(Ce(e.output)), e.output = []) : t != 0 && e.output.push(t);
				},
				fsync(e) {
					0 < e.output?.length && (h(Ce(e.output)), e.output = []);
				}
			}, L = {
				Wa: null,
				Xa() {
					return L.createNode(null, "/", 16895, 0);
				},
				createNode(e, t, n, r) {
					if ((n & 61440) == 24576 || (n & 61440) == 4096) throw new z(63);
					return L.Wa ||= {
						dir: {
							node: {
								Ta: L.La.Ta,
								Ua: L.La.Ua,
								lookup: L.La.lookup,
								ib: L.La.ib,
								rename: L.La.rename,
								unlink: L.La.unlink,
								rmdir: L.La.rmdir,
								readdir: L.La.readdir,
								symlink: L.La.symlink
							},
							stream: { Va: L.Ma.Va }
						},
						file: {
							node: {
								Ta: L.La.Ta,
								Ua: L.La.Ua
							},
							stream: {
								Va: L.Ma.Va,
								read: L.Ma.read,
								write: L.Ma.write,
								jb: L.Ma.jb,
								kb: L.Ma.kb
							}
						},
						link: {
							node: {
								Ta: L.La.Ta,
								Ua: L.La.Ua,
								readlink: L.La.readlink
							},
							stream: {}
						},
						yb: {
							node: {
								Ta: L.La.Ta,
								Ua: L.La.Ua
							},
							stream: Ye
						}
					}, n = He(e, t, n, r), H(n.mode) ? (n.La = L.Wa.dir.node, n.Ma = L.Wa.dir.stream, n.Na = {}) : (n.mode & 61440) == 32768 ? (n.La = L.Wa.file.node, n.Ma = L.Wa.file.stream, n.Ra = 0, n.Na = null) : (n.mode & 61440) == 40960 ? (n.La = L.Wa.link.node, n.Ma = L.Wa.link.stream) : (n.mode & 61440) == 8192 && (n.La = L.Wa.yb.node, n.Ma = L.Wa.yb.stream), n.atime = n.mtime = n.ctime = Date.now(), e && (e.Na[t] = n, e.atime = e.mtime = e.ctime = n.atime), n;
				},
				fc(e) {
					return e.Na ? e.Na.subarray ? e.Na.subarray(0, e.Ra) : new Uint8Array(e.Na) : new Uint8Array();
				},
				La: {
					Ta(e) {
						var t = {};
						return t.dev = (e.mode & 61440) == 8192 ? e.id : 1, t.ino = e.id, t.mode = e.mode, t.nlink = 1, t.uid = 0, t.gid = 0, t.rdev = e.rdev, H(e.mode) ? t.size = 4096 : (e.mode & 61440) == 32768 ? t.size = e.Ra : (e.mode & 61440) == 40960 ? t.size = e.link.length : t.size = 0, t.atime = new Date(e.atime), t.mtime = new Date(e.mtime), t.ctime = new Date(e.ctime), t.blksize = 4096, t.blocks = Math.ceil(t.size / t.blksize), t;
					},
					Ua(e, t) {
						for (var n of [
							"mode",
							"atime",
							"mtime",
							"ctime"
						]) t[n] != null && (e[n] = t[n]);
						t.size !== void 0 && (t = t.size, e.Ra != t && (t == 0 ? (e.Na = null, e.Ra = 0) : (n = e.Na, e.Na = new Uint8Array(t), n && e.Na.set(n.subarray(0, Math.min(t, e.Ra))), e.Ra = t)));
					},
					lookup() {
						throw L.nb || (L.nb = new z(44), L.nb.stack = "<generic error, no stack>"), L.nb;
					},
					ib(e, t, n, r) {
						return L.createNode(e, t, n, r);
					},
					rename(e, t, n) {
						try {
							var r = V(t, n);
						} catch {}
						if (r) {
							if (H(e.mode)) for (var i in r.Na) throw new z(55);
							Ve(r);
						}
						delete e.parent.Na[e.name], t.Na[n] = e, e.name = n, t.ctime = t.mtime = e.parent.ctime = e.parent.mtime = Date.now();
					},
					unlink(e, t) {
						delete e.Na[t], e.ctime = e.mtime = Date.now();
					},
					rmdir(e, t) {
						var n = V(e, t), r;
						for (r in n.Na) throw new z(55);
						delete e.Na[t], e.ctime = e.mtime = Date.now();
					},
					readdir(e) {
						return [
							".",
							"..",
							...Object.keys(e.Na)
						];
					},
					symlink(e, t, n) {
						return e = L.createNode(e, t, 41471, 0), e.link = n, e;
					},
					readlink(e) {
						if ((e.mode & 61440) != 40960) throw new z(28);
						return e.link;
					}
				},
				Ma: {
					read(e, t, n, r, i) {
						var a = e.node.Na;
						if (i >= e.node.Ra) return 0;
						if (e = Math.min(e.node.Ra - i, r), 8 < e && a.subarray) t.set(a.subarray(i, i + e), n);
						else for (r = 0; r < e; r++) t[n + r] = a[i + r];
						return e;
					},
					write(e, t, n, r, i, a) {
						if (t.buffer === b.buffer && (a = !1), !r) return 0;
						if (e = e.node, e.mtime = e.ctime = Date.now(), t.subarray && (!e.Na || e.Na.subarray)) {
							if (a) return e.Na = t.subarray(n, n + r), e.Ra = r;
							if (e.Ra === 0 && i === 0) return e.Na = t.slice(n, n + r), e.Ra = r;
							if (i + r <= e.Ra) return e.Na.set(t.subarray(n, n + r), i), r;
						}
						a = i + r;
						var o = e.Na ? e.Na.length : 0;
						if (o >= a || (a = Math.max(a, o * (1048576 > o ? 2 : 1.125) >>> 0), o != 0 && (a = Math.max(a, 256)), o = e.Na, e.Na = new Uint8Array(a), 0 < e.Ra && e.Na.set(o.subarray(0, e.Ra), 0)), e.Na.subarray && t.subarray) e.Na.set(t.subarray(n, n + r), i);
						else for (a = 0; a < r; a++) e.Na[i + a] = t[n + a];
						return e.Ra = Math.max(e.Ra, i + r), r;
					},
					Va(e, t, n) {
						if (n === 1 ? t += e.position : n === 2 && (e.node.mode & 61440) == 32768 && (t += e.node.Ra), 0 > t) throw new z(28);
						return t;
					},
					jb(e, t, n, r, i) {
						if ((e.node.mode & 61440) != 32768) throw new z(43);
						if (e = e.node.Na, i & 2 || !e || e.buffer !== b.buffer) {
							i = !0, r = 65536 * Math.ceil(t / 65536);
							var a = Pt(65536, r);
							if (a && x.fill(0, a, a + r), r = a, !r) throw new z(48);
							e && ((0 < n || n + t < e.length) && (e = e.subarray ? e.subarray(n, n + t) : Array.prototype.slice.call(e, n, n + t)), b.set(e, r));
						} else i = !1, r = e.byteOffset;
						return {
							Xb: r,
							Eb: i
						};
					},
					kb(e, t, n, r) {
						return L.Ma.write(e, t, 0, r, n, !1), 0;
					}
				}
			}, Ae = (e, t) => {
				var n = 0;
				return e && (n |= 365), t && (n |= 146), n;
			}, je = null, Me = {}, Ne = [], Pe = 1, R = null, Fe = !1, Ie = !0, z = class {
				name = "ErrnoError";
				constructor(e) {
					this.Pa = e;
				}
			}, Le = class {
				hb = {};
				node = null;
				get flags() {
					return this.hb.flags;
				}
				set flags(e) {
					this.hb.flags = e;
				}
				get position() {
					return this.hb.position;
				}
				set position(e) {
					this.hb.position = e;
				}
			}, Re = class {
				La = {};
				Ma = {};
				bb = null;
				constructor(e, t, n, r) {
					e ||= this, this.parent = e, this.Xa = e.Xa, this.id = Pe++, this.name = t, this.mode = n, this.rdev = r, this.atime = this.mtime = this.ctime = Date.now();
				}
				get read() {
					return (this.mode & 365) == 365;
				}
				set read(e) {
					e ? this.mode |= 365 : this.mode &= -366;
				}
				get write() {
					return (this.mode & 146) == 146;
				}
				set write(e) {
					e ? this.mode |= 146 : this.mode &= -147;
				}
			};
			function B(e, t = {}) {
				if (!e) throw new z(44);
				t.pb ??= !0, e.charAt(0) === "/" || (e = "//" + e);
				var n = 0;
				a: for (; 40 > n; n++) {
					e = e.split("/").filter((e) => !!e);
					for (var r = je, i = "/", a = 0; a < e.length; a++) {
						var o = a === e.length - 1;
						if (o && t.parent) break;
						if (e[a] !== ".") if (e[a] === "..") if (i = ve(i), r === r.parent) {
							e = i + "/" + e.slice(a + 1).join("/"), n--;
							continue a;
						} else r = r.parent;
						else {
							i = _e(i + "/" + e[a]);
							try {
								r = V(r, e[a]);
							} catch (e) {
								if (e?.Pa === 44 && o && t.Wb) return { path: i };
								throw e;
							}
							if (!r.bb || o && !t.pb || (r = r.bb.root), (r.mode & 61440) == 40960 && (!o || t.ab)) {
								if (!r.La.readlink) throw new z(52);
								r = r.La.readlink(r), r.charAt(0) === "/" || (r = ve(i) + "/" + r), e = r + "/" + e.slice(a + 1).join("/");
								continue a;
							}
						}
					}
					return {
						path: i,
						node: r
					};
				}
				throw new z(32);
			}
			function ze(e) {
				for (var t;;) {
					if (e === e.parent) return e = e.Xa.Db, t ? e[e.length - 1] === "/" ? e + t : `${e}/${t}` : e;
					t = t ? `${e.name}/${t}` : e.name, e = e.parent;
				}
			}
			function Be(e, t) {
				for (var n = 0, r = 0; r < t.length; r++) n = (n << 5) - n + t.charCodeAt(r) | 0;
				return (e + n >>> 0) % R.length;
			}
			function Ve(e) {
				var t = Be(e.parent.id, e.name);
				if (R[t] === e) R[t] = e.cb;
				else for (t = R[t]; t;) {
					if (t.cb === e) {
						t.cb = e.cb;
						break;
					}
					t = t.cb;
				}
			}
			function V(e, t) {
				var n = H(e.mode) ? (n = U(e, "x")) ? n : e.La.lookup ? 0 : 2 : 54;
				if (n) throw new z(n);
				for (n = R[Be(e.id, t)]; n; n = n.cb) {
					var r = n.name;
					if (n.parent.id === e.id && r === t) return n;
				}
				return e.La.lookup(e, t);
			}
			function He(e, t, n, r) {
				return e = new Re(e, t, n, r), t = Be(e.parent.id, e.name), e.cb = R[t], R[t] = e;
			}
			function H(e) {
				return (e & 61440) == 16384;
			}
			function U(e, t) {
				return Ie ? 0 : t.includes("r") && !(e.mode & 292) || t.includes("w") && !(e.mode & 146) || t.includes("x") && !(e.mode & 73) ? 2 : 0;
			}
			function Ue(e, t) {
				if (!H(e.mode)) return 54;
				try {
					return V(e, t), 20;
				} catch {}
				return U(e, "wx");
			}
			function We(e, t, n) {
				try {
					var r = V(e, t);
				} catch (e) {
					return e.Pa;
				}
				if (e = U(e, "wx")) return e;
				if (n) {
					if (!H(r.mode)) return 54;
					if (r === r.parent || ze(r) === "/") return 10;
				} else if (H(r.mode)) return 31;
				return 0;
			}
			function Ge(e) {
				if (!e) throw new z(63);
				return e;
			}
			function W(e) {
				if (e = Ne[e], !e) throw new z(8);
				return e;
			}
			function Ke(e, t = -1) {
				if (e = Object.assign(new Le(), e), t == -1) a: {
					for (t = 0; 4096 >= t; t++) if (!Ne[t]) break a;
					throw new z(33);
				}
				return e.fd = t, Ne[t] = e;
			}
			function qe(e, t = -1) {
				return e = Ke(e, t), e.Ma?.ec?.(e), e;
			}
			function Je(e, t, n) {
				var r = e?.Ma.Ua;
				e = r ? e : t, r ??= t.La.Ua, Ge(r), r(e, n);
			}
			var Ye = {
				open(e) {
					e.Ma = Me[e.node.rdev].Ma, e.Ma.open?.(e);
				},
				Va() {
					throw new z(70);
				}
			};
			function Xe(e, t) {
				Me[e] = { Ma: t };
			}
			function Ze(e, t) {
				var n = t === "/";
				if (n && je) throw new z(10);
				if (!n && t) {
					var r = B(t, { pb: !1 });
					if (t = r.path, r = r.node, r.bb) throw new z(10);
					if (!H(r.mode)) throw new z(54);
				}
				t = {
					type: e,
					kc: {},
					Db: t,
					Vb: []
				}, e = e.Xa(t), e.Xa = t, t.root = e, n ? je = e : r && (r.bb = t, r.Xa && r.Xa.Vb.push(t));
			}
			function Qe(e, t, n) {
				var r = B(e, { parent: !0 }).node;
				if (e = ye(e), !e) throw new z(28);
				if (e === "." || e === "..") throw new z(20);
				var i = Ue(r, e);
				if (i) throw new z(i);
				if (!r.La.ib) throw new z(63);
				return r.La.ib(r, e, t, n);
			}
			function $e(e, t = 438) {
				return Qe(e, t & 4095 | 32768, 0);
			}
			function G(e, t = 511) {
				return Qe(e, t & 1023 | 16384, 0);
			}
			function et(e, t, n) {
				n === void 0 && (n = t, t = 438), Qe(e, t | 8192, n);
			}
			function tt(e, t) {
				if (!Se(e)) throw new z(44);
				var n = B(t, { parent: !0 }).node;
				if (!n) throw new z(44);
				t = ye(t);
				var r = Ue(n, t);
				if (r) throw new z(r);
				if (!n.La.symlink) throw new z(63);
				n.La.symlink(n, t, e);
			}
			function nt(e) {
				var t = B(e, { parent: !0 }).node;
				e = ye(e);
				var n = V(t, e), r = We(t, e, !0);
				if (r) throw new z(r);
				if (!t.La.rmdir) throw new z(63);
				if (n.bb) throw new z(10);
				t.La.rmdir(t, e), Ve(n);
			}
			function rt(e) {
				var t = B(e, { parent: !0 }).node;
				if (!t) throw new z(44);
				e = ye(e);
				var n = V(t, e), r = We(t, e, !1);
				if (r) throw new z(r);
				if (!t.La.unlink) throw new z(63);
				if (n.bb) throw new z(10);
				t.La.unlink(t, e), Ve(n);
			}
			function it(e, t) {
				return e = B(e, { ab: !t }).node, Ge(e.La.Ta)(e);
			}
			function at(e, t, n, r) {
				Je(e, t, {
					mode: n & 4095 | t.mode & -4096,
					ctime: Date.now(),
					Lb: r
				});
			}
			function ot(e, t) {
				e = typeof e == "string" ? B(e, { ab: !0 }).node : e, at(null, e, t);
			}
			function st(e, t, n) {
				if (H(t.mode)) throw new z(31);
				if ((t.mode & 61440) != 32768) throw new z(28);
				var r = U(t, "w");
				if (r) throw new z(r);
				Je(e, t, {
					size: n,
					timestamp: Date.now()
				});
			}
			function K(e, t, n = 438) {
				if (e === "") throw new z(44);
				if (typeof t == "string") {
					var r = {
						r: 0,
						"r+": 2,
						w: 577,
						"w+": 578,
						a: 1089,
						"a+": 1090
					}[t];
					if (r === void 0) throw Error(`Unknown file open mode: ${t}`);
					t = r;
				}
				if (n = t & 64 ? n & 4095 | 32768 : 0, typeof e == "object") r = e;
				else {
					var i = e.endsWith("/"), a = B(e, {
						ab: !(t & 131072),
						Wb: !0
					});
					r = a.node, e = a.path;
				}
				if (a = !1, t & 64) if (r) {
					if (t & 128) throw new z(20);
				} else {
					if (i) throw new z(31);
					r = Qe(e, n | 511, 0), a = !0;
				}
				if (!r) throw new z(44);
				if ((r.mode & 61440) == 8192 && (t &= -513), t & 65536 && !H(r.mode)) throw new z(54);
				if (!a && (r ? (r.mode & 61440) == 40960 ? i = 32 : (i = [
					"r",
					"w",
					"rw"
				][t & 3], t & 512 && (i += "w"), i = H(r.mode) && (i !== "r" || t & 576) ? 31 : U(r, i)) : i = 44, i)) throw new z(i);
				return t & 512 && !a && (i = r, i = typeof i == "string" ? B(i, { ab: !0 }).node : i, st(null, i, 0)), t = Ke({
					node: r,
					path: ze(r),
					flags: t & -131713,
					seekable: !0,
					position: 0,
					Ma: r.Ma,
					Yb: [],
					error: !1
				}), t.Ma.open && t.Ma.open(t), a && ot(r, n & 511), t;
			}
			function ct(e) {
				if (e.fd === null) throw new z(8);
				e.rb &&= null;
				try {
					e.Ma.close && e.Ma.close(e);
				} catch (e) {
					throw e;
				} finally {
					Ne[e.fd] = null;
				}
				e.fd = null;
			}
			function lt(e, t, n) {
				if (e.fd === null) throw new z(8);
				if (!e.seekable || !e.Ma.Va) throw new z(70);
				if (n != 0 && n != 1 && n != 2) throw new z(28);
				e.position = e.Ma.Va(e, t, n), e.Yb = [];
			}
			function ut(e, t, n, r, i) {
				if (0 > r || 0 > i) throw new z(28);
				if (e.fd === null || (e.flags & 2097155) == 1) throw new z(8);
				if (H(e.node.mode)) throw new z(31);
				if (!e.Ma.read) throw new z(28);
				var a = i !== void 0;
				if (!a) i = e.position;
				else if (!e.seekable) throw new z(70);
				return t = e.Ma.read(e, t, n, r, i), a || (e.position += t), t;
			}
			function dt(e, t, n, r, i) {
				if (0 > r || 0 > i) throw new z(28);
				if (e.fd === null || !(e.flags & 2097155)) throw new z(8);
				if (H(e.node.mode)) throw new z(31);
				if (!e.Ma.write) throw new z(28);
				e.seekable && e.flags & 1024 && lt(e, 0, 2);
				var a = i !== void 0;
				if (!a) i = e.position;
				else if (!e.seekable) throw new z(70);
				return t = e.Ma.write(e, t, n, r, i, void 0), a || (e.position += t), t;
			}
			function ft(e) {
				var t = t || 0, n = "binary";
				n !== "utf8" && n !== "binary" && O(`Invalid encoding type "${n}"`), t = K(e, t), e = it(e).size;
				var r = new Uint8Array(e);
				return ut(t, r, 0, e, 0), n === "utf8" && (r = Ce(r)), ct(t), r;
			}
			function q(e, t, n) {
				e = _e("/dev/" + e);
				var r = Ae(!!t, !!n);
				q.Cb ??= 64;
				var i = q.Cb++ << 8 | 0;
				Xe(i, {
					open(e) {
						e.seekable = !1;
					},
					close() {
						n?.buffer?.length && n(10);
					},
					read(e, n, r, i) {
						for (var a = 0, o = 0; o < i; o++) {
							try {
								var s = t();
							} catch {
								throw new z(29);
							}
							if (s === void 0 && a === 0) throw new z(6);
							if (s == null) break;
							a++, n[r + o] = s;
						}
						return a && (e.node.atime = Date.now()), a;
					},
					write(e, t, r, i) {
						for (var a = 0; a < i; a++) try {
							n(t[r + a]);
						} catch {
							throw new z(29);
						}
						return i && (e.node.mtime = e.node.ctime = Date.now()), a;
					}
				}), et(e, r, i);
			}
			var J = {};
			function Y(e, t, n) {
				if (t.charAt(0) === "/") return t;
				if (e = e === -100 ? "/" : W(e).path, t.length == 0) {
					if (!n) throw new z(44);
					return e;
				}
				return e + "/" + t;
			}
			function pt(e, t) {
				w[e >> 2] = t.dev, w[e + 4 >> 2] = t.mode, w[e + 8 >> 2] = t.nlink, w[e + 12 >> 2] = t.uid, w[e + 16 >> 2] = t.gid, w[e + 20 >> 2] = t.rdev, E[e + 24 >> 3] = BigInt(t.size), C[e + 32 >> 2] = 4096, C[e + 36 >> 2] = t.blocks;
				var n = t.atime.getTime(), r = t.mtime.getTime(), i = t.ctime.getTime();
				return E[e + 40 >> 3] = BigInt(Math.floor(n / 1e3)), w[e + 48 >> 2] = n % 1e3 * 1e6, E[e + 56 >> 3] = BigInt(Math.floor(r / 1e3)), w[e + 64 >> 2] = r % 1e3 * 1e6, E[e + 72 >> 3] = BigInt(Math.floor(i / 1e3)), w[e + 80 >> 2] = i % 1e3 * 1e6, E[e + 88 >> 3] = BigInt(t.ino), 0;
			}
			var mt = void 0, ht = () => {
				var e = C[mt >> 2];
				return mt += 4, e;
			}, gt = 0, _t = [
				0,
				31,
				60,
				91,
				121,
				152,
				182,
				213,
				244,
				274,
				305,
				335
			], vt = [
				0,
				31,
				59,
				90,
				120,
				151,
				181,
				212,
				243,
				273,
				304,
				334
			], yt = {}, bt = (e) => {
				v = e, pe || 0 < gt || (o.onExit?.(e), _ = !0), d(e, new ce(e));
			}, xt = (e) => {
				if (!_) try {
					e();
				} catch (e) {
					e instanceof ce || e == "unwind" || d(1, e);
				} finally {
					if (!(pe || 0 < gt)) try {
						v = e = v, bt(e);
					} catch (e) {
						e instanceof ce || e == "unwind" || d(1, e);
					}
				}
			}, St = {}, Ct = () => {
				if (!wt) {
					var e = {
						USER: "web_user",
						LOGNAME: "web_user",
						PATH: "/",
						PWD: "/",
						HOME: "/home/web_user",
						LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8",
						_: u || "./this.program"
					}, t;
					for (t in St) St[t] === void 0 ? delete e[t] : e[t] = St[t];
					var n = [];
					for (t in e) n.push(`${t}=${e[t]}`);
					wt = n;
				}
				return wt;
			}, wt, Tt = (e, t, n, r) => {
				var i = {
					string: (e) => {
						var t = 0;
						if (e != null && e !== 0) {
							t = F(e) + 1;
							var n = Q(t);
							I(e, x, n, t), t = n;
						}
						return t;
					},
					array: (e) => {
						var t = Q(e.length);
						return b.set(e, t), t;
					}
				};
				e = o["_" + e];
				var a = [], s = 0;
				if (r) for (var c = 0; c < r.length; c++) {
					var l = i[n[c]];
					l ? (s === 0 && (s = Lt()), a[c] = l(r[c])) : a[c] = r[c];
				}
				return n = e(...a), n = function(e) {
					return s !== 0 && It(s), t === "string" ? P(e) : t === "boolean" ? !!e : e;
				}(n);
			}, Et = (e) => {
				var t = F(e) + 1, n = Mt(t);
				return n && I(e, x, n, t), n;
			}, X, Dt = [], Z = (e) => {
				X.delete($.get(e)), $.set(e, null), Dt.push(e);
			}, Ot = (e) => {
				let t = e.length;
				return [
					t % 128 | 128,
					t >> 7,
					...e
				];
			}, kt = {
				i: 127,
				p: 127,
				j: 126,
				f: 125,
				d: 124,
				e: 111
			}, At = (e) => Ot(Array.from(e, (e) => kt[e])), jt = (e, t) => {
				if (!X) {
					X = /* @__PURE__ */ new WeakMap();
					var n = $.length;
					if (X) for (var r = 0; r < 0 + n; r++) {
						var i = $.get(r);
						i && X.set(i, r);
					}
				}
				if (n = X.get(e) || 0) return n;
				n = Dt.length ? Dt.pop() : $.grow(1);
				try {
					$.set(n, e);
				} catch (r) {
					if (!(r instanceof TypeError)) throw r;
					t = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...Ot([
						1,
						96,
						...At(t.slice(1)),
						...At(t[0] === "v" ? "" : t[0])
					]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0), t = new WebAssembly.Module(t), t = new WebAssembly.Instance(t, { e: { f: e } }).exports.f, $.set(n, t);
				}
				return X.set(e, n), n;
			};
			if (R = Array(4096), Ze(L, "/"), G("/tmp"), G("/home"), G("/home/web_user"), (function() {
				G("/dev"), Xe(259, {
					read: () => 0,
					write: (e, t, n, r) => r,
					Va: () => 0
				}), et("/dev/null", 259), Ee(1280, Oe), Ee(1536, ke), et("/dev/tty", 1280), et("/dev/tty1", 1536);
				var e = new Uint8Array(1024), t = 0, n = () => (t === 0 && (xe(e), t = e.byteLength), e[--t]);
				q("random", n), q("urandom", n), G("/dev/shm"), G("/dev/shm/tmp");
			})(), (function() {
				G("/proc");
				var e = G("/proc/self");
				G("/proc/self/fd"), Ze({ Xa() {
					var t = He(e, "fd", 16895, 73);
					return t.Ma = { Va: L.Ma.Va }, t.La = {
						lookup(e, t) {
							e = +t;
							var n = W(e);
							return e = {
								parent: null,
								Xa: { Db: "fake" },
								La: { readlink: () => n.path },
								id: e + 1
							}, e.parent = e;
						},
						readdir() {
							return Array.from(Ne.entries()).filter(([, e]) => e).map(([e]) => e.toString());
						}
					}, t;
				} }, "/proc/self/fd");
			})(), o.noExitRuntime && (pe = o.noExitRuntime), o.print && (m = o.print), o.printErr && (h = o.printErr), o.wasmBinary && (g = o.wasmBinary), o.thisProgram && (u = o.thisProgram), o.preInit) for (typeof o.preInit == "function" && (o.preInit = [o.preInit]); 0 < o.preInit.length;) o.preInit.shift()();
			o.stackSave = () => Lt(), o.stackRestore = (e) => It(e), o.stackAlloc = (e) => Q(e), o.cwrap = (e, t, n, r) => {
				var i = !n || n.every((e) => e === "number" || e === "boolean");
				return t !== "string" && i && !r ? o["_" + e] : (...r) => Tt(e, t, n, r);
			}, o.addFunction = jt, o.removeFunction = Z, o.UTF8ToString = P, o.stringToNewUTF8 = Et, o.writeArrayToMemory = (e, t) => {
				b.set(e, t);
			};
			var Mt, Nt, Pt, Ft, It, Q, Lt, Rt, $, zt = {
				a: (e, t, n, r) => O(`Assertion failed: ${P(e)}, at: ` + [
					t ? P(t) : "unknown filename",
					n,
					r ? P(r) : "unknown function"
				]),
				i: function(e, t) {
					try {
						return e = P(e), ot(e, t), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				L: function(e, t, n) {
					try {
						if (t = P(t), t = Y(e, t), n & -8) return -28;
						var r = B(t, { ab: !0 }).node;
						return r ? (e = "", n & 4 && (e += "r"), n & 2 && (e += "w"), n & 1 && (e += "x"), e && U(r, e) ? -2 : 0) : -44;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				j: function(e, t) {
					try {
						var n = W(e);
						return at(n, n.node, t, !1), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				h: function(e) {
					try {
						var t = W(e);
						return Je(t, t.node, {
							timestamp: Date.now(),
							Lb: !1
						}), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				b: function(e, t, n) {
					mt = n;
					try {
						var r = W(e);
						switch (t) {
							case 0:
								var i = ht();
								if (0 > i) break;
								for (; Ne[i];) i++;
								return qe(r, i).fd;
							case 1:
							case 2: return 0;
							case 3: return r.flags;
							case 4: return i = ht(), r.flags |= i, 0;
							case 12: return i = ht(), S[i + 0 >> 1] = 2, 0;
							case 13:
							case 14: return 0;
						}
						return -28;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				g: function(e, t) {
					try {
						var n = W(e), r = n.node, i = n.Ma.Ta;
						return e = i ? n : r, i ??= r.La.Ta, Ge(i), pt(t, i(e));
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				H: function(e, t) {
					t = -9007199254740992 > t || 9007199254740992 < t ? NaN : Number(t);
					try {
						if (isNaN(t)) return -61;
						var n = W(e);
						if (0 > t || !(n.flags & 2097155)) throw new z(28);
						return st(n, n.node, t), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				G: function(e, t) {
					try {
						if (t === 0) return -28;
						var n = F("/") + 1;
						return t < n ? -68 : (I("/", x, e, t), n);
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				K: function(e, t) {
					try {
						return e = P(e), pt(t, it(e, !0));
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				C: function(e, t, n) {
					try {
						return t = P(t), t = Y(e, t), G(t, n), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				J: function(e, t, n, r) {
					try {
						t = P(t);
						var i = r & 256;
						return t = Y(e, t, r & 4096), pt(n, i ? it(t, !0) : it(t));
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				x: function(e, t, n, r) {
					mt = r;
					try {
						t = P(t), t = Y(e, t);
						var i = r ? ht() : 0;
						return K(t, n, i).fd;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				v: function(e, t, n, r) {
					try {
						if (t = P(t), t = Y(e, t), 0 >= r) return -28;
						var i = B(t).node;
						if (!i) throw new z(44);
						if (!i.La.readlink) throw new z(28);
						var a = i.La.readlink(i), o = Math.min(r, F(a)), s = b[n + o];
						return I(a, x, n, r + 1), b[n + o] = s, o;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				u: function(e) {
					try {
						return e = P(e), nt(e), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				f: function(e, t) {
					try {
						return e = P(e), pt(t, it(e));
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				r: function(e, t, n) {
					try {
						if (t = P(t), t = Y(e, t), n) if (n === 512) nt(t);
						else return -28;
						else rt(t);
						return 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				q: function(e, t, n) {
					try {
						t = P(t), t = Y(e, t, !0);
						var r = Date.now(), i, a;
						if (n) {
							var o = w[n >> 2] + 4294967296 * C[n + 4 >> 2], s = C[n + 8 >> 2];
							i = s == 1073741823 ? r : s == 1073741822 ? null : 1e3 * o + s / 1e6, n += 16, o = w[n >> 2] + 4294967296 * C[n + 4 >> 2], s = C[n + 8 >> 2], a = s == 1073741823 ? r : s == 1073741822 ? null : 1e3 * o + s / 1e6;
						} else a = i = r;
						if ((a ?? i) !== null) {
							e = i;
							var c = B(t, { ab: !0 }).node;
							Ge(c.La.Ua)(c, {
								atime: e,
								mtime: a
							});
						}
						return 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				m: () => O(""),
				l: () => {
					pe = !1, gt = 0;
				},
				A: function(e, t) {
					e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), e = /* @__PURE__ */ new Date(1e3 * e), C[t >> 2] = e.getSeconds(), C[t + 4 >> 2] = e.getMinutes(), C[t + 8 >> 2] = e.getHours(), C[t + 12 >> 2] = e.getDate(), C[t + 16 >> 2] = e.getMonth(), C[t + 20 >> 2] = e.getFullYear() - 1900, C[t + 24 >> 2] = e.getDay();
					var n = e.getFullYear();
					C[t + 28 >> 2] = (n % 4 != 0 || n % 100 == 0 && n % 400 != 0 ? vt : _t)[e.getMonth()] + e.getDate() - 1 | 0, C[t + 36 >> 2] = -(60 * e.getTimezoneOffset()), n = new Date(e.getFullYear(), 6, 1).getTimezoneOffset();
					var r = new Date(e.getFullYear(), 0, 1).getTimezoneOffset();
					C[t + 32 >> 2] = (n != r && e.getTimezoneOffset() == Math.min(r, n)) | 0;
				},
				y: function(e, t, n, r, i, a, o) {
					i = -9007199254740992 > i || 9007199254740992 < i ? NaN : Number(i);
					try {
						var s = W(r);
						if (t & 2 && !(n & 2) && (s.flags & 2097155) != 2 || (s.flags & 2097155) == 1) throw new z(2);
						if (!s.Ma.jb) throw new z(43);
						if (!e) throw new z(28);
						var c = s.Ma.jb(s, e, i, t, n), l = c.Xb;
						return C[a >> 2] = c.Eb, w[o >> 2] = l, 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				z: function(e, t, n, r, i, a) {
					a = -9007199254740992 > a || 9007199254740992 < a ? NaN : Number(a);
					try {
						var o = W(i);
						if (n & 2) {
							if (n = a, (o.node.mode & 61440) != 32768) throw new z(43);
							if (!(r & 2)) {
								var s = x.slice(e, e + t);
								o.Ma.kb && o.Ma.kb(o, s, n, t, r);
							}
						}
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				n: (e, t) => (yt[e] && (clearTimeout(yt[e].id), delete yt[e]), t && (yt[e] = {
					id: setTimeout(() => {
						delete yt[e], xt(() => Ft(e, performance.now()));
					}, t),
					lc: t
				}), 0),
				B: (e, t, n, r) => {
					var i = (/* @__PURE__ */ new Date()).getFullYear(), a = new Date(i, 0, 1).getTimezoneOffset();
					i = new Date(i, 6, 1).getTimezoneOffset(), w[e >> 2] = 60 * Math.max(a, i), C[t >> 2] = Number(a != i), t = (e) => {
						var t = Math.abs(e);
						return `UTC${0 <= e ? "-" : "+"}${String(Math.floor(t / 60)).padStart(2, "0")}${String(t % 60).padStart(2, "0")}`;
					}, e = t(a), t = t(i), i < a ? (I(e, x, n, 17), I(t, x, r, 17)) : (I(e, x, r, 17), I(t, x, n, 17));
				},
				d: () => Date.now(),
				s: () => 2147483648,
				c: () => performance.now(),
				o: (e) => {
					var t = x.length;
					if (e >>>= 0, 2147483648 < e) return !1;
					for (var n = 1; 4 >= n; n *= 2) {
						var r = t * (1 + .2 / n);
						r = Math.min(r, e + 100663296);
						a: {
							r = (Math.min(2147483648, 65536 * Math.ceil(Math.max(e, r) / 65536)) - Rt.buffer.byteLength + 65535) / 65536 | 0;
							try {
								Rt.grow(r), D();
								var i = 1;
								break a;
							} catch {}
							i = void 0;
						}
						if (i) return !0;
					}
					return !1;
				},
				E: (e, t) => {
					var n = 0, r = 0, i;
					for (i of Ct()) {
						var a = t + n;
						w[e + r >> 2] = a, n += I(i, x, a, Infinity) + 1, r += 4;
					}
					return 0;
				},
				F: (e, t) => {
					var n = Ct();
					w[e >> 2] = n.length, e = 0;
					for (var r of n) e += F(r) + 1;
					return w[t >> 2] = e, 0;
				},
				e: function(e) {
					try {
						return ct(W(e)), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				p: function(e, t) {
					try {
						var n = W(e);
						return b[t] = n.tty ? 2 : H(n.mode) ? 3 : (n.mode & 61440) == 40960 ? 7 : 4, S[t + 2 >> 1] = 0, E[t + 8 >> 3] = BigInt(0), E[t + 16 >> 3] = BigInt(0), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				w: function(e, t, n, r) {
					try {
						a: {
							var i = W(e);
							e = t;
							for (var a, o = t = 0; o < n; o++) {
								var s = w[e >> 2], c = w[e + 4 >> 2];
								e += 8;
								var l = ut(i, b, s, c, a);
								if (0 > l) {
									var u = -1;
									break a;
								}
								if (t += l, l < c) break;
								a !== void 0 && (a += l);
							}
							u = t;
						}
						return w[r >> 2] = u, 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				D: function(e, t, n, r) {
					t = -9007199254740992 > t || 9007199254740992 < t ? NaN : Number(t);
					try {
						if (isNaN(t)) return 61;
						var i = W(e);
						return lt(i, t, n), E[r >> 3] = BigInt(i.position), i.rb && t === 0 && n === 0 && (i.rb = null), 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				I: function(e) {
					try {
						var t = W(e);
						return t.Ma?.fsync?.(t);
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				t: function(e, t, n, r) {
					try {
						a: {
							var i = W(e);
							e = t;
							for (var a, o = t = 0; o < n; o++) {
								var s = w[e >> 2], c = w[e + 4 >> 2];
								e += 8;
								var l = dt(i, b, s, c, a);
								if (0 > l) {
									var u = -1;
									break a;
								}
								if (t += l, l < c) break;
								a !== void 0 && (a += l);
							}
							u = t;
						}
						return w[r >> 2] = u, 0;
					} catch (e) {
						if (J === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				k: bt
			};
			function Bt() {
				function e() {
					if (o.calledRun = !0, !_) {
						if (!o.noFSInit && !Fe) {
							var e, t;
							Fe = !0, e ??= o.stdin, t ??= o.stdout, n ??= o.stderr, e ? q("stdin", e) : tt("/dev/tty", "/dev/stdin"), t ? q("stdout", null, t) : tt("/dev/tty", "/dev/stdout"), n ? q("stderr", null, n) : tt("/dev/tty1", "/dev/stderr"), K("/dev/stdin", 0), K("/dev/stdout", 1), K("/dev/stderr", 1);
						}
						if (Vt.N(), Ie = !1, o.onRuntimeInitialized?.(), o.postRun) for (typeof o.postRun == "function" && (o.postRun = [o.postRun]); o.postRun.length;) {
							var n = o.postRun.shift();
							ue.push(n);
						}
						le(ue);
					}
				}
				if (0 < A) j = Bt;
				else {
					if (o.preRun) for (typeof o.preRun == "function" && (o.preRun = [o.preRun]); o.preRun.length;) fe();
					le(de), 0 < A ? j = Bt : o.setStatus ? (o.setStatus("Running..."), setTimeout(() => {
						setTimeout(() => o.setStatus(""), 1), e();
					}, 1)) : e();
				}
			}
			var Vt;
			return (async function() {
				function e(e) {
					return e = Vt = e.exports, o._sqlite3_free = e.P, o._sqlite3_value_text = e.Q, o._sqlite3_prepare_v2 = e.R, o._sqlite3_step = e.S, o._sqlite3_reset = e.T, o._sqlite3_exec = e.U, o._sqlite3_finalize = e.V, o._sqlite3_column_name = e.W, o._sqlite3_column_text = e.X, o._sqlite3_column_type = e.Y, o._sqlite3_errmsg = e.Z, o._sqlite3_clear_bindings = e._, o._sqlite3_value_blob = e.$, o._sqlite3_value_bytes = e.aa, o._sqlite3_value_double = e.ba, o._sqlite3_value_int = e.ca, o._sqlite3_value_type = e.da, o._sqlite3_result_blob = e.ea, o._sqlite3_result_double = e.fa, o._sqlite3_result_error = e.ga, o._sqlite3_result_int = e.ha, o._sqlite3_result_int64 = e.ia, o._sqlite3_result_null = e.ja, o._sqlite3_result_text = e.ka, o._sqlite3_aggregate_context = e.la, o._sqlite3_column_count = e.ma, o._sqlite3_data_count = e.na, o._sqlite3_column_blob = e.oa, o._sqlite3_column_bytes = e.pa, o._sqlite3_column_double = e.qa, o._sqlite3_bind_blob = e.ra, o._sqlite3_bind_double = e.sa, o._sqlite3_bind_int = e.ta, o._sqlite3_bind_text = e.ua, o._sqlite3_bind_parameter_index = e.va, o._sqlite3_sql = e.wa, o._sqlite3_normalized_sql = e.xa, o._sqlite3_changes = e.ya, o._sqlite3_close_v2 = e.za, o._sqlite3_create_function_v2 = e.Aa, o._sqlite3_update_hook = e.Ba, o._sqlite3_open = e.Ca, Mt = o._malloc = e.Da, Nt = o._free = e.Ea, o._RegisterExtensionFunctions = e.Fa, Pt = e.Ga, Ft = e.Ha, It = e.Ia, Q = e.Ja, Lt = e.Ka, Rt = e.M, $ = e.O, D(), A--, o.monitorRunDependencies?.(A), A == 0 && j && (e = j, j = null, e()), Vt;
				}
				A++, o.monitorRunDependencies?.(A);
				var t = { a: zt };
				return o.instantiateWasm ? new Promise((n) => {
					o.instantiateWasm(t, (t, r) => {
						n(e(t, r));
					});
				}) : (k ??= o.locateFile ? o.locateFile("sql-wasm.wasm", f) : f + "sql-wasm.wasm", e((await se(t)).instance));
			})(), Bt(), i;
		}), n);
	};
	typeof e == "object" && typeof t == "object" ? (t.exports = r, t.exports.default = r) : typeof define == "function" && define.amd ? define([], function() {
		return r;
	}) : typeof e == "object" && (e.Module = r);
})))(), 1), h = s(import.meta.url), g = a.dirname(h), _ = a.join(n.getPath("userData"), "noteszen.db"), v = null;
function y() {
	let e = [
		a.join(g, "../node_modules/sql.js/dist/sql-wasm.wasm"),
		a.join(n.getAppPath(), "node_modules/sql.js/dist/sql-wasm.wasm"),
		a.join(g, "sql-wasm.wasm")
	];
	for (let t of e) if (o.existsSync(t)) return t;
	let t = a.join(n.getAppPath(), "dist-electron", "sql-wasm.wasm");
	if (o.existsSync(t)) return t;
	let r = a.join(n.getAppPath(), "..", "node_modules", "sql.js", "dist", "sql-wasm.wasm");
	return o.existsSync(r) ? r : e[0];
}
async function b() {
	try {
		let e = y(), t = o.readFileSync(e), n = await (0, m.default)({ wasmBinary: new Uint8Array(t) });
		if (o.existsSync(_)) {
			let e = o.readFileSync(_);
			v = new n.Database(e);
		} else v = new n.Database(), v.run("\n        CREATE TABLE IF NOT EXISTS notes (\n          id TEXT PRIMARY KEY,\n          title TEXT,\n          content TEXT,\n          folder TEXT,\n          isPinned INTEGER DEFAULT 0,\n          isFavorite INTEGER DEFAULT 0,\n          isArchived INTEGER DEFAULT 0,\n          createdAt TEXT,\n          updatedAt TEXT\n        );\n        \n        CREATE TABLE IF NOT EXISTS tags (\n          noteId TEXT,\n          tag TEXT,\n          PRIMARY KEY (noteId, tag)\n        );\n\n        CREATE TABLE IF NOT EXISTS backlinks (\n          sourceId TEXT,\n          targetId TEXT,\n          PRIMARY KEY (sourceId, targetId)\n        );\n      "), x();
		console.log("Database initialized successfully at:", _);
	} catch (e) {
		console.error("Failed to initialize sql.js database:", e), v = new (await ((0, m.default)())).Database(), v.run("\n      CREATE TABLE IF NOT EXISTS notes (\n        id TEXT PRIMARY KEY,\n        title TEXT,\n        content TEXT,\n        folder TEXT,\n        isPinned INTEGER DEFAULT 0,\n        isFavorite INTEGER DEFAULT 0,\n        isArchived INTEGER DEFAULT 0,\n        createdAt TEXT,\n        updatedAt TEXT\n      );\n      CREATE TABLE IF NOT EXISTS tags (noteId TEXT, tag TEXT, PRIMARY KEY (noteId, tag));\n      CREATE TABLE IF NOT EXISTS backlinks (sourceId TEXT, targetId TEXT, PRIMARY KEY (sourceId, targetId));\n    ");
	}
}
function x() {
	try {
		if (!v) return;
		let e = v.export(), t = Buffer.from(e);
		o.writeFileSync(_, t);
	} catch (e) {
		console.error("Error saving SQLite database file:", e);
	}
}
function S() {
	try {
		if (!v) return [];
		let e = v.prepare("\n      SELECT n.*, \n             (SELECT group_concat(t.tag) FROM tags t WHERE t.noteId = n.id) as tagList,\n             (SELECT group_concat(b.targetId) FROM backlinks b WHERE b.sourceId = n.id) as targetList\n      FROM notes n\n    "), t = [];
		for (; e.step();) {
			let n = e.getAsObject();
			t.push({
				id: n.id,
				title: n.title,
				content: n.content,
				folder: n.folder,
				isPinned: n.isPinned === 1,
				isFavorite: n.isFavorite === 1,
				isArchived: n.isArchived === 1,
				createdAt: n.createdAt,
				updatedAt: n.updatedAt,
				tags: n.tagList ? n.tagList.split(",") : [],
				backlinks: n.targetList ? n.targetList.split(",") : []
			});
		}
		return e.free(), t;
	} catch (e) {
		return console.error("Error querying SQLite notes:", e), [];
	}
}
function C(e) {
	try {
		if (!v) return !1;
		if (v.run("\n      INSERT OR REPLACE INTO notes (id, title, content, folder, isPinned, isFavorite, isArchived, createdAt, updatedAt)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ", [
			e.id,
			e.title,
			e.content,
			e.folder,
			+!!e.isPinned,
			+!!e.isFavorite,
			+!!e.isArchived,
			e.createdAt,
			e.updatedAt
		]), v.run("DELETE FROM tags WHERE noteId = ?", [e.id]), e.tags && e.tags.length > 0) {
			let t = v.prepare("INSERT INTO tags (noteId, tag) VALUES (?, ?)");
			for (let n of e.tags) n.trim() && t.run([e.id, n.trim()]);
			t.free();
		}
		if (v.run("DELETE FROM backlinks WHERE sourceId = ?", [e.id]), e.backlinks && e.backlinks.length > 0) {
			let t = v.prepare("INSERT INTO backlinks (sourceId, targetId) VALUES (?, ?)");
			for (let n of e.backlinks) n.trim() && t.run([e.id, n.trim()]);
			t.free();
		}
		return x(), !0;
	} catch (e) {
		return console.error("Error saving SQLite note:", e), !1;
	}
}
function w(e) {
	try {
		return v ? (v.run("DELETE FROM notes WHERE id = ?", [e]), v.run("DELETE FROM tags WHERE noteId = ?", [e]), v.run("DELETE FROM backlinks WHERE sourceId = ? OR targetId = ?", [e, e]), x(), !0) : !1;
	} catch (e) {
		return console.error("Error deleting SQLite note:", e), !1;
	}
}
//#endregion
//#region electron/main.ts
var ie = s(import.meta.url), T = a.dirname(ie);
process.env.DIST = a.join(T, "../dist"), process.env.VITE_PUBLIC = n.isPackaged ? process.env.DIST : a.join(process.env.DIST, "../public");
var E = null, D = null;
function O() {
	try {
		let e = a.join(T, "../node_modules/sql.js/dist/sql-wasm.wasm"), t = a.join(T, "sql-wasm.wasm");
		o.existsSync(e) && !o.existsSync(t) && (o.copyFileSync(e, t), console.log("Copied sql-wasm.wasm to build folder."));
	} catch (e) {
		console.error("Failed to copy sql-wasm.wasm:", e);
	}
}
function k() {
	E = new t({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 650,
		frame: !1,
		webPreferences: {
			preload: a.join(T, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), process.env.VITE_DEV_SERVER_URL ? E.loadURL(process.env.VITE_DEV_SERVER_URL) : E.loadFile(a.join(process.env.DIST, "index.html"));
}
function ae() {
	D = new t({
		width: 500,
		height: 200,
		frame: !1,
		resizable: !1,
		show: !1,
		alwaysOnTop: !0,
		skipTaskbar: !0,
		webPreferences: {
			preload: a.join(T, "preload.mjs"),
			nodeIntegration: !1,
			contextIsolation: !0
		}
	}), process.env.VITE_DEV_SERVER_URL ? D.loadURL(`${process.env.VITE_DEV_SERVER_URL}#quick-capture`) : D.loadFile(a.join(process.env.DIST, "index.html"), { hash: "quick-capture" }), D.on("blur", () => {
		D?.hide();
	});
}
function oe() {
	D || ae(), D?.isVisible() ? D.hide() : (D?.show(), D?.center(), D?.focus());
}
n.on("window-all-closed", () => {
	process.platform !== "darwin" && (n.quit(), E = null, D = null);
}), n.on("activate", () => {
	t.getAllWindows().length === 0 && k();
}), n.whenReady().then(async () => {
	O(), await b(), k(), ae(), r.register("CommandOrControl+Shift+Space", () => {
		oe();
	}), i.handle("get-notes", async () => S()), i.handle("save-note", async (e, t) => C(t)), i.handle("delete-note", async (e, t) => w(t)), i.on("window-min", () => {
		E?.minimize();
	}), i.on("window-max", () => {
		E?.isMaximized() ? E.unmaximize() : E?.maximize();
	}), i.on("window-close", () => {
		E?.close();
	}), i.on("close-quick-capture", () => {
		D?.hide();
	});
}), n.on("will-quit", () => {
	r.unregisterAll();
});
//#endregion
export {};
