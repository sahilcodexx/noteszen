import { n as e, t } from "./main.js";
//#region node_modules/sql.js/dist/sql-wasm.js
var n = /* @__PURE__ */ t(((t, n) => {
	var r = void 0, i = function(t) {
		return r || (r = new Promise(function(r, i) {
			var a = t === void 0 ? {} : t, o = a.onAbort;
			a.onAbort = function(e) {
				i(Error(e)), o && o(e);
			}, a.postRun = a.postRun || [], a.postRun.push(function() {
				r(a);
			}), n = void 0;
			var s;
			s ||= a === void 0 ? {} : a;
			var c = !!globalThis.window, l = !!globalThis.WorkerGlobalScope, u = globalThis.process?.versions?.node && globalThis.process?.type != "renderer";
			s.onRuntimeInitialized = function() {
				function e(e, t) {
					switch (typeof t) {
						case "boolean":
							O(e, +!!t);
							break;
						case "number":
							ge(e, t);
							break;
						case "string":
							T(e, t, -1, -1);
							break;
						case "object":
							if (t === null) _e(e);
							else if (t.length != null) {
								var n = Nt(t.length);
								v.set(t, n), E(e, n, t.length, -1), Z(n);
							} else A(e, "Wrong API use : tried to return a value of an unknown type (" + t + ").", -1);
							break;
						default: _e(e);
					}
				}
				function t(e, t) {
					for (var n = [], r = 0; r < e; r += 1) {
						var i = D(t + 4 * r, "i32"), a = de(i);
						if (a === 1 || a === 2) i = he(i);
						else if (a === 3) i = pe(i);
						else if (a === 4) {
							a = i, i = fe(a), a = me(a);
							for (var o = new Uint8Array(i), s = 0; s < i; s += 1) o[s] = v[a + s];
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
					if (this.db = t, this.fb = Dt(e), this.fb === null) throw Error("Unable to allocate memory for the SQL string");
					this.lb = this.fb, this.$a = this.sb = null;
				}
				function i(e) {
					if (this.filename = "dbfile_" + (4294967295 * Math.random() >>> 0), e != null) {
						var t = this.filename, n = "/", r = t;
						if (n && (n = typeof n == "string" ? n : Ve(n), r = t ? be(n + "/" + t) : n), t = Ne(!0, !0), r = tt(r, t), e) {
							if (typeof e == "string") {
								n = Array(e.length);
								for (var i = 0, o = e.length; i < o; ++i) n[i] = e.charCodeAt(i);
								e = n;
							}
							st(r, t | 146), n = G(r, 577), ft(n, e, 0, e.length, 0), lt(n), st(r, t);
						}
					}
					this.handleError(c(this.filename, a)), this.db = D(a, "i32"), ye(this.db), this.gb = {}, this.Sa = {};
				}
				var a = Q(4), o = s.cwrap, c = o("sqlite3_open", "number", ["string", "number"]), l = o("sqlite3_close_v2", "number", ["number"]), u = o("sqlite3_exec", "number", [
					"number",
					"string",
					"number",
					"number",
					"number"
				]), ee = o("sqlite3_changes", "number", ["number"]), d = o("sqlite3_prepare_v2", "number", [
					"number",
					"string",
					"number",
					"number",
					"number"
				]), te = o("sqlite3_sql", "string", ["number"]), ne = o("sqlite3_normalized_sql", "string", ["number"]), f = o("sqlite3_prepare_v2", "number", [
					"number",
					"number",
					"number",
					"number",
					"number"
				]), p = o("sqlite3_bind_text", "number", [
					"number",
					"number",
					"number",
					"number",
					"number"
				]), m = o("sqlite3_bind_blob", "number", [
					"number",
					"number",
					"number",
					"number",
					"number"
				]), re = o("sqlite3_bind_double", "number", [
					"number",
					"number",
					"number"
				]), h = o("sqlite3_bind_int", "number", [
					"number",
					"number",
					"number"
				]), g = o("sqlite3_bind_parameter_index", "number", ["number", "string"]), _ = o("sqlite3_step", "number", ["number"]), ie = o("sqlite3_errmsg", "string", ["number"]), ae = o("sqlite3_column_count", "number", ["number"]), y = o("sqlite3_data_count", "number", ["number"]), b = o("sqlite3_column_double", "number", ["number", "number"]), x = o("sqlite3_column_text", "string", ["number", "number"]), S = o("sqlite3_column_blob", "number", ["number", "number"]), oe = o("sqlite3_column_bytes", "number", ["number", "number"]), se = o("sqlite3_column_type", "number", ["number", "number"]), C = o("sqlite3_column_name", "string", ["number", "number"]), ce = o("sqlite3_reset", "number", ["number"]), w = o("sqlite3_clear_bindings", "number", ["number"]), le = o("sqlite3_finalize", "number", ["number"]), ue = o("sqlite3_create_function_v2", "number", "number string number number number number number number number".split(" ")), de = o("sqlite3_value_type", "number", ["number"]), fe = o("sqlite3_value_bytes", "number", ["number"]), pe = o("sqlite3_value_text", "string", ["number"]), me = o("sqlite3_value_blob", "number", ["number"]), he = o("sqlite3_value_double", "number", ["number"]), ge = o("sqlite3_result_double", "", ["number", "number"]), _e = o("sqlite3_result_null", "", ["number"]), T = o("sqlite3_result_text", "", [
					"number",
					"string",
					"number",
					"number"
				]), E = o("sqlite3_result_blob", "", [
					"number",
					"number",
					"number",
					"number"
				]), O = o("sqlite3_result_int", "", ["number", "number"]), A = o("sqlite3_result_error", "", [
					"number",
					"string",
					"number"
				]), ve = o("sqlite3_aggregate_context", "number", ["number", "number"]), ye = o("RegisterExtensionFunctions", "number", ["number"]), xe = o("sqlite3_update_hook", "number", [
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
					return e ?? (e = this.Oa, this.Oa += 1), b(this.Qa, e);
				}, n.prototype.Ob = function(e) {
					if (e ?? (e = this.Oa, this.Oa += 1), e = x(this.Qa, e), typeof BigInt != "function") throw Error("BigInt is not supported");
					return BigInt(e);
				}, n.prototype.Tb = function(e) {
					return e ?? (e = this.Oa, this.Oa += 1), x(this.Qa, e);
				}, n.prototype.getBlob = function(e) {
					e ?? (e = this.Oa, this.Oa += 1);
					var t = oe(this.Qa, e);
					e = S(this.Qa, e);
					for (var n = new Uint8Array(t), r = 0; r < t; r += 1) n[r] = v[e + r];
					return n;
				}, n.prototype.get = function(e, t) {
					t ||= {}, e != null && this.bind(e) && this.step(), e = [];
					for (var n = y(this.Qa), r = 0; r < n; r += 1) switch (se(this.Qa, r)) {
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
					for (var e = [], t = ae(this.Qa), n = 0; n < t; n += 1) e.push(C(this.Qa, n));
					return e;
				}, n.prototype.zb = function(e, t) {
					e = this.get(e, t), t = this.qb();
					for (var n = {}, r = 0; r < t.length; r += 1) n[t[r]] = e[r];
					return n;
				}, n.prototype.Sb = function() {
					return te(this.Qa);
				}, n.prototype.Pb = function() {
					return ne(this.Qa);
				}, n.prototype.run = function(e) {
					return e != null && this.bind(e), this.step(), this.reset();
				}, n.prototype.wb = function(e, t) {
					t ?? (t = this.Oa, this.Oa += 1), e = Dt(e), this.mb.push(e), this.db.handleError(p(this.Qa, t, e, -1, 0));
				}, n.prototype.Fb = function(e, t) {
					t ?? (t = this.Oa, this.Oa += 1);
					var n = Nt(e.length);
					v.set(e, n), this.mb.push(n), this.db.handleError(m(this.Qa, t, n, e.length, 0));
				}, n.prototype.vb = function(e, t) {
					t ?? (t = this.Oa, this.Oa += 1), this.db.handleError((e === (e | 0) ? h : re)(this.Qa, t, e));
				}, n.prototype.Ib = function(e) {
					e ?? (e = this.Oa, this.Oa += 1), m(this.Qa, e, 0, 0, 0);
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
					return this.freemem(), w(this.Qa) === 0 && ce(this.Qa) === 0;
				}, n.prototype.freemem = function() {
					for (var e; (e = this.mb.pop()) !== void 0;) Z(e);
				}, n.prototype.Ya = function() {
					this.freemem();
					var e = le(this.Qa) === 0;
					return delete this.db.gb[this.Qa], this.Qa = 0, e;
				}, r.prototype.next = function() {
					if (this.fb === null) return { done: !0 };
					if (this.$a !== null && (this.$a.Ya(), this.$a = null), !this.db.db) throw this.ob(), Error("Database closed");
					var e = Lt(), t = Q(4);
					k(a), k(t);
					try {
						this.db.handleError(f(this.db.db, this.lb, -1, a, t)), this.lb = D(t, "i32");
						var r = D(a, "i32");
						return r === 0 ? (this.ob(), { done: !0 }) : (this.$a = new n(r, this.db), this.db.gb[r] = this.$a, {
							value: this.$a,
							done: !1
						});
					} catch (e) {
						throw this.sb = j(this.lb), this.ob(), e;
					} finally {
						It(e);
					}
				}, r.prototype.ob = function() {
					Z(this.fb), this.fb = null;
				}, r.prototype.Qb = function() {
					return this.sb === null ? j(this.lb) : this.sb;
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
						s = o = Dt(e);
						var c = Q(4);
						for (e = []; D(s, "i8") !== 0;) {
							k(a), k(c), this.handleError(f(this.db, s, -1, a, c));
							var l = D(a, "i32");
							if (s = D(c, "i32"), l !== 0) {
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
						o && Z(o);
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
					if (k(a), this.handleError(d(this.db, e, -1, a, 0)), e = D(a, "i32"), e === 0) throw "Nothing to prepare";
					var r = new n(e, this);
					return t != null && r.bind(t), this.gb[e] = r;
				}, i.prototype.Ub = function(e) {
					return new r(e, this);
				}, i.prototype.Nb = function() {
					Object.values(this.gb).forEach(function(e) {
						e.Ya();
					}), Object.values(this.Sa).forEach(X), this.Sa = {}, this.handleError(l(this.db));
					var e = pt(this.filename);
					return this.handleError(c(this.filename, a)), this.db = D(a, "i32"), ye(this.db), e;
				}, i.prototype.close = function() {
					this.db !== null && (Object.values(this.gb).forEach(function(e) {
						e.Ya();
					}), Object.values(this.Sa).forEach(X), this.Sa = {}, this.Za &&= (X(this.Za), void 0), this.handleError(l(this.db)), at("/" + this.filename), this.db = null);
				}, i.prototype.handleError = function(e) {
					if (e === 0) return null;
					throw e = ie(this.db), Error(e);
				}, i.prototype.Rb = function() {
					return ee(this.db);
				}, i.prototype.Kb = function(n, r) {
					Object.prototype.hasOwnProperty.call(this.Sa, n) && (X(this.Sa[n]), delete this.Sa[n]);
					var i = Mt(function(n, i, a) {
						i = t(i, a);
						try {
							var o = r.apply(null, i);
						} catch (e) {
							A(n, e, -1);
							return;
						}
						e(n, o);
					}, "viii");
					return this.Sa[n] = i, this.handleError(ue(this.db, n, r.length, 1, 0, i, 0, 0, 0)), this;
				}, i.prototype.Jb = function(n, r) {
					var i = r.init || function() {
						return null;
					}, a = r.finalize || function(e) {
						return e;
					}, o = r.step;
					if (!o) throw "An aggregate function must have a step function in " + n;
					var s = {};
					Object.hasOwnProperty.call(this.Sa, n) && (X(this.Sa[n]), delete this.Sa[n]), r = n + "__finalize", Object.hasOwnProperty.call(this.Sa, r) && (X(this.Sa[r]), delete this.Sa[r]);
					var c = Mt(function(e, n, r) {
						var a = ve(e, 1);
						Object.hasOwnProperty.call(s, a) || (s[a] = i()), n = t(n, r), n = [s[a]].concat(n);
						try {
							s[a] = o.apply(null, n);
						} catch (t) {
							delete s[a], A(e, t, -1);
						}
					}, "viii"), l = Mt(function(t) {
						var n = ve(t, 1);
						try {
							var r = a(s[n]);
						} catch (e) {
							delete s[n], A(t, e, -1);
							return;
						}
						e(t, r), delete s[n];
					}, "vi");
					return this.Sa[n] = c, this.Sa[r] = l, this.handleError(ue(this.db, n, o.length - 1, 1, 0, 0, c, l, 0)), this;
				}, i.prototype.Zb = function(e) {
					return this.Za &&= (xe(this.db, 0, 0), X(this.Za), void 0), e ? (this.Za = Mt(function(t, n, r, i, a) {
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
						if (r = j(r), i = j(i), a > 2 ** 53 - 1) throw "rowId too big to fit inside a Number";
						e(t, r, i, Number(a));
					}, "viiiij"), xe(this.db, this.Za, 0), this) : this;
				}, n.prototype.bind = n.prototype.bind, n.prototype.step = n.prototype.step, n.prototype.get = n.prototype.get, n.prototype.getColumnNames = n.prototype.qb, n.prototype.getAsObject = n.prototype.zb, n.prototype.getSQL = n.prototype.Sb, n.prototype.getNormalizedSQL = n.prototype.Pb, n.prototype.run = n.prototype.run, n.prototype.reset = n.prototype.reset, n.prototype.freemem = n.prototype.freemem, n.prototype.free = n.prototype.Ya, r.prototype.next = r.prototype.next, r.prototype.getRemainingSQL = r.prototype.Qb, i.prototype.run = i.prototype.run, i.prototype.exec = i.prototype.exec, i.prototype.each = i.prototype.Mb, i.prototype.prepare = i.prototype.tb, i.prototype.iterateStatements = i.prototype.Ub, i.prototype.export = i.prototype.Nb, i.prototype.close = i.prototype.close, i.prototype.handleError = i.prototype.handleError, i.prototype.getRowsModified = i.prototype.Rb, i.prototype.create_function = i.prototype.Kb, i.prototype.create_aggregate = i.prototype.Jb, i.prototype.updateHook = i.prototype.Zb, s.Database = i;
			};
			var ee = "./this.program", d = (e, t) => {
				throw t;
			}, te = globalThis.document?.currentScript?.src;
			typeof __filename < "u" ? te = __filename : l && (te = self.location.href);
			var ne = "", f, p;
			if (u) {
				var m = e("node:fs");
				ne = __dirname + "/", p = (e) => (e = ae(e) ? new URL(e) : e, m.readFileSync(e)), f = async (e) => (e = ae(e) ? new URL(e) : e, m.readFileSync(e, void 0)), 1 < process.argv.length && (ee = process.argv[1].replace(/\\/g, "/")), process.argv.slice(2), n !== void 0 && (n.exports = s), d = (e, t) => {
					throw process.exitCode = e, t;
				};
			} else if (c || l) {
				try {
					ne = new URL(".", te).href;
				} catch {}
				l && (p = (e) => {
					var t = new XMLHttpRequest();
					return t.open("GET", e, !1), t.responseType = "arraybuffer", t.send(null), new Uint8Array(t.response);
				}), f = async (e) => {
					if (ae(e)) return new Promise((t, n) => {
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
			var re = console.log.bind(console), h = console.error.bind(console), g, _ = !1, ie, ae = (e) => e.startsWith("file://"), v, y, b, x, S, oe, se, C;
			function ce() {
				var e = Rt.buffer;
				v = new Int8Array(e), b = new Int16Array(e), y = new Uint8Array(e), new Uint16Array(e), x = new Int32Array(e), S = new Uint32Array(e), oe = new Float32Array(e), se = new Float64Array(e), C = new BigInt64Array(e), new BigUint64Array(e);
			}
			function w(e) {
				throw s.onAbort?.(e), e = "Aborted(" + e + ")", h(e), _ = !0, new WebAssembly.RuntimeError(e + ". Build with -sASSERTIONS for more info.");
			}
			var le;
			async function ue(e) {
				if (!g) try {
					var t = await f(e);
					return new Uint8Array(t);
				} catch {}
				if (e == le && g) e = new Uint8Array(g);
				else if (p) e = p(e);
				else throw "both async and sync fetching of the wasm failed";
				return e;
			}
			async function de(e, t) {
				try {
					var n = await ue(e);
					return await WebAssembly.instantiate(n, t);
				} catch (e) {
					h(`failed to asynchronously prepare wasm: ${e}`), w(e);
				}
			}
			async function fe(e) {
				var t = le;
				if (!g && !ae(t) && !u) try {
					var n = fetch(t, { credentials: "same-origin" });
					return await WebAssembly.instantiateStreaming(n, e);
				} catch (e) {
					h(`wasm streaming compile failed: ${e}`), h("falling back to ArrayBuffer instantiation");
				}
				return de(t, e);
			}
			class pe {
				name = "ExitStatus";
				constructor(e) {
					this.message = `Program terminated with exit(${e})`, this.status = e;
				}
			}
			var me = (e) => {
				for (; 0 < e.length;) e.shift()(s);
			}, he = [], ge = [], _e = () => {
				var e = s.preRun.shift();
				ge.push(e);
			}, T = 0, E = null;
			function D(e, t = "i8") {
				switch (t.endsWith("*") && (t = "*"), t) {
					case "i1": return v[e];
					case "i8": return v[e];
					case "i16": return b[e >> 1];
					case "i32": return x[e >> 2];
					case "i64": return C[e >> 3];
					case "float": return oe[e >> 2];
					case "double": return se[e >> 3];
					case "*": return S[e >> 2];
					default: w(`invalid type for getValue: ${t}`);
				}
			}
			var O = !0;
			function k(e) {
				var t = "i32";
				switch (t.endsWith("*") && (t = "*"), t) {
					case "i1":
						v[e] = 0;
						break;
					case "i8":
						v[e] = 0;
						break;
					case "i16":
						b[e >> 1] = 0;
						break;
					case "i32":
						x[e >> 2] = 0;
						break;
					case "i64":
						C[e >> 3] = BigInt(0);
						break;
					case "float":
						oe[e >> 2] = 0;
						break;
					case "double":
						se[e >> 3] = 0;
						break;
					case "*":
						S[e >> 2] = 0;
						break;
					default: w(`invalid type for setValue: ${t}`);
				}
			}
			var A = new TextDecoder(), ve = (e, t, n, r) => {
				if (n = t + n, r) return n;
				for (; e[t] && !(t >= n);) ++t;
				return t;
			}, j = (e, t, n) => e ? A.decode(y.subarray(e, ve(y, e, t, n))) : "", ye = (e, t) => {
				for (var n = 0, r = e.length - 1; 0 <= r; r--) {
					var i = e[r];
					i === "." ? e.splice(r, 1) : i === ".." ? (e.splice(r, 1), n++) : n && (e.splice(r, 1), n--);
				}
				if (t) for (; n; n--) e.unshift("..");
				return e;
			}, be = (e) => {
				var t = e.charAt(0) === "/", n = e.slice(-1) === "/";
				return (e = ye(e.split("/").filter((e) => !!e), !t).join("/")) || t || (e = "."), e && n && (e += "/"), (t ? "/" : "") + e;
			}, xe = (e) => {
				var t = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1);
				return e = t[0], t = t[1], !e && !t ? "." : (t &&= t.slice(0, -1), e + t);
			}, Se = (e) => e && e.match(/([^\/]+|\/)\/*$/)[1], Ce = () => {
				if (u) {
					var t = e("node:crypto");
					return (e) => t.randomFillSync(e);
				}
				return (e) => crypto.getRandomValues(e);
			}, we = (e) => {
				(we = Ce())(e);
			}, Te = (...e) => {
				for (var t = "", n = !1, r = e.length - 1; -1 <= r && !n; r--) {
					if (n = 0 <= r ? e[r] : "/", typeof n != "string") throw TypeError("Arguments to path.resolve must be strings");
					if (!n) return "";
					t = n + "/" + t, n = n.charAt(0) === "/";
				}
				return t = ye(t.split("/").filter((e) => !!e), !n).join("/"), (n ? "/" : "") + t || ".";
			}, Ee = (e) => {
				var t = ve(e, 0);
				return A.decode(e.buffer ? e.subarray(0, t) : new Uint8Array(e.slice(0, t)));
			}, De = [], M = (e) => {
				for (var t = 0, n = 0; n < e.length; ++n) {
					var r = e.charCodeAt(n);
					127 >= r ? t++ : 2047 >= r ? t += 2 : 55296 <= r && 57343 >= r ? (t += 4, ++n) : t += 3;
				}
				return t;
			}, N = (e, t, n, r) => {
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
			}, Oe = [];
			function ke(e, t) {
				Oe[e] = {
					input: [],
					output: [],
					eb: t
				}, Qe(e, Ae);
			}
			var Ae = {
				open(e) {
					var t = Oe[e.node.rdev];
					if (!t) throw new L(43);
					e.tty = t, e.seekable = !1;
				},
				close(e) {
					e.tty.eb.fsync(e.tty);
				},
				fsync(e) {
					e.tty.eb.fsync(e.tty);
				},
				read(e, t, n, r) {
					if (!e.tty || !e.tty.eb.Bb) throw new L(60);
					for (var i = 0, a = 0; a < r; a++) {
						try {
							var o = e.tty.eb.Bb(e.tty);
						} catch {
							throw new L(29);
						}
						if (o === void 0 && i === 0) throw new L(6);
						if (o == null) break;
						i++, t[n + a] = o;
					}
					return i && (e.node.atime = Date.now()), i;
				},
				write(e, t, n, r) {
					if (!e.tty || !e.tty.eb.ub) throw new L(60);
					try {
						for (var i = 0; i < r; i++) e.tty.eb.ub(e.tty, t[n + i]);
					} catch {
						throw new L(29);
					}
					return r && (e.node.mtime = e.node.ctime = Date.now()), i;
				}
			}, je = {
				Bb() {
					a: {
						if (!De.length) {
							var e = null;
							if (u) {
								var t = Buffer.alloc(256), n = 0, r = process.stdin.fd;
								try {
									n = m.readSync(r, t, 0, 256);
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
							t = Array(M(e) + 1), e = N(e, t, 0, t.length), t.length = e, De = t;
						}
						e = De.shift();
					}
					return e;
				},
				ub(e, t) {
					t === null || t === 10 ? (re(Ee(e.output)), e.output = []) : t != 0 && e.output.push(t);
				},
				fsync(e) {
					0 < e.output?.length && (re(Ee(e.output)), e.output = []);
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
			}, Me = {
				ub(e, t) {
					t === null || t === 10 ? (h(Ee(e.output)), e.output = []) : t != 0 && e.output.push(t);
				},
				fsync(e) {
					0 < e.output?.length && (h(Ee(e.output)), e.output = []);
				}
			}, P = {
				Wa: null,
				Xa() {
					return P.createNode(null, "/", 16895, 0);
				},
				createNode(e, t, n, r) {
					if ((n & 61440) == 24576 || (n & 61440) == 4096) throw new L(63);
					return P.Wa ||= {
						dir: {
							node: {
								Ta: P.La.Ta,
								Ua: P.La.Ua,
								lookup: P.La.lookup,
								ib: P.La.ib,
								rename: P.La.rename,
								unlink: P.La.unlink,
								rmdir: P.La.rmdir,
								readdir: P.La.readdir,
								symlink: P.La.symlink
							},
							stream: { Va: P.Ma.Va }
						},
						file: {
							node: {
								Ta: P.La.Ta,
								Ua: P.La.Ua
							},
							stream: {
								Va: P.Ma.Va,
								read: P.Ma.read,
								write: P.Ma.write,
								jb: P.Ma.jb,
								kb: P.Ma.kb
							}
						},
						link: {
							node: {
								Ta: P.La.Ta,
								Ua: P.La.Ua,
								readlink: P.La.readlink
							},
							stream: {}
						},
						yb: {
							node: {
								Ta: P.La.Ta,
								Ua: P.La.Ua
							},
							stream: Ze
						}
					}, n = We(e, t, n, r), B(n.mode) ? (n.La = P.Wa.dir.node, n.Ma = P.Wa.dir.stream, n.Na = {}) : (n.mode & 61440) == 32768 ? (n.La = P.Wa.file.node, n.Ma = P.Wa.file.stream, n.Ra = 0, n.Na = null) : (n.mode & 61440) == 40960 ? (n.La = P.Wa.link.node, n.Ma = P.Wa.link.stream) : (n.mode & 61440) == 8192 && (n.La = P.Wa.yb.node, n.Ma = P.Wa.yb.stream), n.atime = n.mtime = n.ctime = Date.now(), e && (e.Na[t] = n, e.atime = e.mtime = e.ctime = n.atime), n;
				},
				fc(e) {
					return e.Na ? e.Na.subarray ? e.Na.subarray(0, e.Ra) : new Uint8Array(e.Na) : new Uint8Array();
				},
				La: {
					Ta(e) {
						var t = {};
						return t.dev = (e.mode & 61440) == 8192 ? e.id : 1, t.ino = e.id, t.mode = e.mode, t.nlink = 1, t.uid = 0, t.gid = 0, t.rdev = e.rdev, B(e.mode) ? t.size = 4096 : (e.mode & 61440) == 32768 ? t.size = e.Ra : (e.mode & 61440) == 40960 ? t.size = e.link.length : t.size = 0, t.atime = new Date(e.atime), t.mtime = new Date(e.mtime), t.ctime = new Date(e.ctime), t.blksize = 4096, t.blocks = Math.ceil(t.size / t.blksize), t;
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
						throw P.nb || (P.nb = new L(44), P.nb.stack = "<generic error, no stack>"), P.nb;
					},
					ib(e, t, n, r) {
						return P.createNode(e, t, n, r);
					},
					rename(e, t, n) {
						try {
							var r = z(t, n);
						} catch {}
						if (r) {
							if (B(e.mode)) for (var i in r.Na) throw new L(55);
							Ue(r);
						}
						delete e.parent.Na[e.name], t.Na[n] = e, e.name = n, t.ctime = t.mtime = e.parent.ctime = e.parent.mtime = Date.now();
					},
					unlink(e, t) {
						delete e.Na[t], e.ctime = e.mtime = Date.now();
					},
					rmdir(e, t) {
						var n = z(e, t), r;
						for (r in n.Na) throw new L(55);
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
						return e = P.createNode(e, t, 41471, 0), e.link = n, e;
					},
					readlink(e) {
						if ((e.mode & 61440) != 40960) throw new L(28);
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
						if (t.buffer === v.buffer && (a = !1), !r) return 0;
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
						if (n === 1 ? t += e.position : n === 2 && (e.node.mode & 61440) == 32768 && (t += e.node.Ra), 0 > t) throw new L(28);
						return t;
					},
					jb(e, t, n, r, i) {
						if ((e.node.mode & 61440) != 32768) throw new L(43);
						if (e = e.node.Na, i & 2 || !e || e.buffer !== v.buffer) {
							i = !0, r = 65536 * Math.ceil(t / 65536);
							var a = Pt(65536, r);
							if (a && y.fill(0, a, a + r), r = a, !r) throw new L(48);
							e && ((0 < n || n + t < e.length) && (e = e.subarray ? e.subarray(n, n + t) : Array.prototype.slice.call(e, n, n + t)), v.set(e, r));
						} else i = !1, r = e.byteOffset;
						return {
							Xb: r,
							Eb: i
						};
					},
					kb(e, t, n, r) {
						return P.Ma.write(e, t, 0, r, n, !1), 0;
					}
				}
			}, Ne = (e, t) => {
				var n = 0;
				return e && (n |= 365), t && (n |= 146), n;
			}, Pe = null, Fe = {}, F = [], Ie = 1, I = null, Le = !1, Re = !0, L = class {
				name = "ErrnoError";
				constructor(e) {
					this.Pa = e;
				}
			}, ze = class {
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
			}, Be = class {
				La = {};
				Ma = {};
				bb = null;
				constructor(e, t, n, r) {
					e ||= this, this.parent = e, this.Xa = e.Xa, this.id = Ie++, this.name = t, this.mode = n, this.rdev = r, this.atime = this.mtime = this.ctime = Date.now();
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
			function R(e, t = {}) {
				if (!e) throw new L(44);
				t.pb ??= !0, e.charAt(0) === "/" || (e = "//" + e);
				var n = 0;
				a: for (; 40 > n; n++) {
					e = e.split("/").filter((e) => !!e);
					for (var r = Pe, i = "/", a = 0; a < e.length; a++) {
						var o = a === e.length - 1;
						if (o && t.parent) break;
						if (e[a] !== ".") if (e[a] === "..") if (i = xe(i), r === r.parent) {
							e = i + "/" + e.slice(a + 1).join("/"), n--;
							continue a;
						} else r = r.parent;
						else {
							i = be(i + "/" + e[a]);
							try {
								r = z(r, e[a]);
							} catch (e) {
								if (e?.Pa === 44 && o && t.Wb) return { path: i };
								throw e;
							}
							if (!r.bb || o && !t.pb || (r = r.bb.root), (r.mode & 61440) == 40960 && (!o || t.ab)) {
								if (!r.La.readlink) throw new L(52);
								r = r.La.readlink(r), r.charAt(0) === "/" || (r = xe(i) + "/" + r), e = r + "/" + e.slice(a + 1).join("/");
								continue a;
							}
						}
					}
					return {
						path: i,
						node: r
					};
				}
				throw new L(32);
			}
			function Ve(e) {
				for (var t;;) {
					if (e === e.parent) return e = e.Xa.Db, t ? e[e.length - 1] === "/" ? e + t : `${e}/${t}` : e;
					t = t ? `${e.name}/${t}` : e.name, e = e.parent;
				}
			}
			function He(e, t) {
				for (var n = 0, r = 0; r < t.length; r++) n = (n << 5) - n + t.charCodeAt(r) | 0;
				return (e + n >>> 0) % I.length;
			}
			function Ue(e) {
				var t = He(e.parent.id, e.name);
				if (I[t] === e) I[t] = e.cb;
				else for (t = I[t]; t;) {
					if (t.cb === e) {
						t.cb = e.cb;
						break;
					}
					t = t.cb;
				}
			}
			function z(e, t) {
				var n = B(e.mode) ? (n = V(e, "x")) ? n : e.La.lookup ? 0 : 2 : 54;
				if (n) throw new L(n);
				for (n = I[He(e.id, t)]; n; n = n.cb) {
					var r = n.name;
					if (n.parent.id === e.id && r === t) return n;
				}
				return e.La.lookup(e, t);
			}
			function We(e, t, n, r) {
				return e = new Be(e, t, n, r), t = He(e.parent.id, e.name), e.cb = I[t], I[t] = e;
			}
			function B(e) {
				return (e & 61440) == 16384;
			}
			function V(e, t) {
				return Re ? 0 : t.includes("r") && !(e.mode & 292) || t.includes("w") && !(e.mode & 146) || t.includes("x") && !(e.mode & 73) ? 2 : 0;
			}
			function Ge(e, t) {
				if (!B(e.mode)) return 54;
				try {
					return z(e, t), 20;
				} catch {}
				return V(e, "wx");
			}
			function Ke(e, t, n) {
				try {
					var r = z(e, t);
				} catch (e) {
					return e.Pa;
				}
				if (e = V(e, "wx")) return e;
				if (n) {
					if (!B(r.mode)) return 54;
					if (r === r.parent || Ve(r) === "/") return 10;
				} else if (B(r.mode)) return 31;
				return 0;
			}
			function qe(e) {
				if (!e) throw new L(63);
				return e;
			}
			function H(e) {
				if (e = F[e], !e) throw new L(8);
				return e;
			}
			function Je(e, t = -1) {
				if (e = Object.assign(new ze(), e), t == -1) a: {
					for (t = 0; 4096 >= t; t++) if (!F[t]) break a;
					throw new L(33);
				}
				return e.fd = t, F[t] = e;
			}
			function Ye(e, t = -1) {
				return e = Je(e, t), e.Ma?.ec?.(e), e;
			}
			function Xe(e, t, n) {
				var r = e?.Ma.Ua;
				e = r ? e : t, r ??= t.La.Ua, qe(r), r(e, n);
			}
			var Ze = {
				open(e) {
					e.Ma = Fe[e.node.rdev].Ma, e.Ma.open?.(e);
				},
				Va() {
					throw new L(70);
				}
			};
			function Qe(e, t) {
				Fe[e] = { Ma: t };
			}
			function $e(e, t) {
				var n = t === "/";
				if (n && Pe) throw new L(10);
				if (!n && t) {
					var r = R(t, { pb: !1 });
					if (t = r.path, r = r.node, r.bb) throw new L(10);
					if (!B(r.mode)) throw new L(54);
				}
				t = {
					type: e,
					kc: {},
					Db: t,
					Vb: []
				}, e = e.Xa(t), e.Xa = t, t.root = e, n ? Pe = e : r && (r.bb = t, r.Xa && r.Xa.Vb.push(t));
			}
			function et(e, t, n) {
				var r = R(e, { parent: !0 }).node;
				if (e = Se(e), !e) throw new L(28);
				if (e === "." || e === "..") throw new L(20);
				var i = Ge(r, e);
				if (i) throw new L(i);
				if (!r.La.ib) throw new L(63);
				return r.La.ib(r, e, t, n);
			}
			function tt(e, t = 438) {
				return et(e, t & 4095 | 32768, 0);
			}
			function U(e, t = 511) {
				return et(e, t & 1023 | 16384, 0);
			}
			function nt(e, t, n) {
				n === void 0 && (n = t, t = 438), et(e, t | 8192, n);
			}
			function rt(e, t) {
				if (!Te(e)) throw new L(44);
				var n = R(t, { parent: !0 }).node;
				if (!n) throw new L(44);
				t = Se(t);
				var r = Ge(n, t);
				if (r) throw new L(r);
				if (!n.La.symlink) throw new L(63);
				n.La.symlink(n, t, e);
			}
			function it(e) {
				var t = R(e, { parent: !0 }).node;
				e = Se(e);
				var n = z(t, e), r = Ke(t, e, !0);
				if (r) throw new L(r);
				if (!t.La.rmdir) throw new L(63);
				if (n.bb) throw new L(10);
				t.La.rmdir(t, e), Ue(n);
			}
			function at(e) {
				var t = R(e, { parent: !0 }).node;
				if (!t) throw new L(44);
				e = Se(e);
				var n = z(t, e), r = Ke(t, e, !1);
				if (r) throw new L(r);
				if (!t.La.unlink) throw new L(63);
				if (n.bb) throw new L(10);
				t.La.unlink(t, e), Ue(n);
			}
			function W(e, t) {
				return e = R(e, { ab: !t }).node, qe(e.La.Ta)(e);
			}
			function ot(e, t, n, r) {
				Xe(e, t, {
					mode: n & 4095 | t.mode & -4096,
					ctime: Date.now(),
					Lb: r
				});
			}
			function st(e, t) {
				e = typeof e == "string" ? R(e, { ab: !0 }).node : e, ot(null, e, t);
			}
			function ct(e, t, n) {
				if (B(t.mode)) throw new L(31);
				if ((t.mode & 61440) != 32768) throw new L(28);
				var r = V(t, "w");
				if (r) throw new L(r);
				Xe(e, t, {
					size: n,
					timestamp: Date.now()
				});
			}
			function G(e, t, n = 438) {
				if (e === "") throw new L(44);
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
					var i = e.endsWith("/"), a = R(e, {
						ab: !(t & 131072),
						Wb: !0
					});
					r = a.node, e = a.path;
				}
				if (a = !1, t & 64) if (r) {
					if (t & 128) throw new L(20);
				} else {
					if (i) throw new L(31);
					r = et(e, n | 511, 0), a = !0;
				}
				if (!r) throw new L(44);
				if ((r.mode & 61440) == 8192 && (t &= -513), t & 65536 && !B(r.mode)) throw new L(54);
				if (!a && (r ? (r.mode & 61440) == 40960 ? i = 32 : (i = [
					"r",
					"w",
					"rw"
				][t & 3], t & 512 && (i += "w"), i = B(r.mode) && (i !== "r" || t & 576) ? 31 : V(r, i)) : i = 44, i)) throw new L(i);
				return t & 512 && !a && (i = r, i = typeof i == "string" ? R(i, { ab: !0 }).node : i, ct(null, i, 0)), t = Je({
					node: r,
					path: Ve(r),
					flags: t & -131713,
					seekable: !0,
					position: 0,
					Ma: r.Ma,
					Yb: [],
					error: !1
				}), t.Ma.open && t.Ma.open(t), a && st(r, n & 511), t;
			}
			function lt(e) {
				if (e.fd === null) throw new L(8);
				e.rb &&= null;
				try {
					e.Ma.close && e.Ma.close(e);
				} catch (e) {
					throw e;
				} finally {
					F[e.fd] = null;
				}
				e.fd = null;
			}
			function ut(e, t, n) {
				if (e.fd === null) throw new L(8);
				if (!e.seekable || !e.Ma.Va) throw new L(70);
				if (n != 0 && n != 1 && n != 2) throw new L(28);
				e.position = e.Ma.Va(e, t, n), e.Yb = [];
			}
			function dt(e, t, n, r, i) {
				if (0 > r || 0 > i) throw new L(28);
				if (e.fd === null || (e.flags & 2097155) == 1) throw new L(8);
				if (B(e.node.mode)) throw new L(31);
				if (!e.Ma.read) throw new L(28);
				var a = i !== void 0;
				if (!a) i = e.position;
				else if (!e.seekable) throw new L(70);
				return t = e.Ma.read(e, t, n, r, i), a || (e.position += t), t;
			}
			function ft(e, t, n, r, i) {
				if (0 > r || 0 > i) throw new L(28);
				if (e.fd === null || !(e.flags & 2097155)) throw new L(8);
				if (B(e.node.mode)) throw new L(31);
				if (!e.Ma.write) throw new L(28);
				e.seekable && e.flags & 1024 && ut(e, 0, 2);
				var a = i !== void 0;
				if (!a) i = e.position;
				else if (!e.seekable) throw new L(70);
				return t = e.Ma.write(e, t, n, r, i, void 0), a || (e.position += t), t;
			}
			function pt(e) {
				var t = t || 0, n = "binary";
				n !== "utf8" && n !== "binary" && w(`Invalid encoding type "${n}"`), t = G(e, t), e = W(e).size;
				var r = new Uint8Array(e);
				return dt(t, r, 0, e, 0), n === "utf8" && (r = Ee(r)), lt(t), r;
			}
			function K(e, t, n) {
				e = be("/dev/" + e);
				var r = Ne(!!t, !!n);
				K.Cb ??= 64;
				var i = K.Cb++ << 8 | 0;
				Qe(i, {
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
								throw new L(29);
							}
							if (s === void 0 && a === 0) throw new L(6);
							if (s == null) break;
							a++, n[r + o] = s;
						}
						return a && (e.node.atime = Date.now()), a;
					},
					write(e, t, r, i) {
						for (var a = 0; a < i; a++) try {
							n(t[r + a]);
						} catch {
							throw new L(29);
						}
						return i && (e.node.mtime = e.node.ctime = Date.now()), a;
					}
				}), nt(e, r, i);
			}
			var q = {};
			function J(e, t, n) {
				if (t.charAt(0) === "/") return t;
				if (e = e === -100 ? "/" : H(e).path, t.length == 0) {
					if (!n) throw new L(44);
					return e;
				}
				return e + "/" + t;
			}
			function mt(e, t) {
				S[e >> 2] = t.dev, S[e + 4 >> 2] = t.mode, S[e + 8 >> 2] = t.nlink, S[e + 12 >> 2] = t.uid, S[e + 16 >> 2] = t.gid, S[e + 20 >> 2] = t.rdev, C[e + 24 >> 3] = BigInt(t.size), x[e + 32 >> 2] = 4096, x[e + 36 >> 2] = t.blocks;
				var n = t.atime.getTime(), r = t.mtime.getTime(), i = t.ctime.getTime();
				return C[e + 40 >> 3] = BigInt(Math.floor(n / 1e3)), S[e + 48 >> 2] = n % 1e3 * 1e6, C[e + 56 >> 3] = BigInt(Math.floor(r / 1e3)), S[e + 64 >> 2] = r % 1e3 * 1e6, C[e + 72 >> 3] = BigInt(Math.floor(i / 1e3)), S[e + 80 >> 2] = i % 1e3 * 1e6, C[e + 88 >> 3] = BigInt(t.ino), 0;
			}
			var ht = void 0, gt = () => {
				var e = x[ht >> 2];
				return ht += 4, e;
			}, _t = 0, vt = [
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
			], yt = [
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
			], bt = {}, xt = (e) => {
				ie = e, O || 0 < _t || (s.onExit?.(e), _ = !0), d(e, new pe(e));
			}, St = (e) => {
				if (!_) try {
					e();
				} catch (e) {
					e instanceof pe || e == "unwind" || d(1, e);
				} finally {
					if (!(O || 0 < _t)) try {
						ie = e = ie, xt(e);
					} catch (e) {
						e instanceof pe || e == "unwind" || d(1, e);
					}
				}
			}, Ct = {}, wt = () => {
				if (!Tt) {
					var e = {
						USER: "web_user",
						LOGNAME: "web_user",
						PATH: "/",
						PWD: "/",
						HOME: "/home/web_user",
						LANG: (globalThis.navigator?.language ?? "C").replace("-", "_") + ".UTF-8",
						_: ee || "./this.program"
					}, t;
					for (t in Ct) Ct[t] === void 0 ? delete e[t] : e[t] = Ct[t];
					var n = [];
					for (t in e) n.push(`${t}=${e[t]}`);
					Tt = n;
				}
				return Tt;
			}, Tt, Et = (e, t, n, r) => {
				var i = {
					string: (e) => {
						var t = 0;
						if (e != null && e !== 0) {
							t = M(e) + 1;
							var n = Q(t);
							N(e, y, n, t), t = n;
						}
						return t;
					},
					array: (e) => {
						var t = Q(e.length);
						return v.set(e, t), t;
					}
				};
				e = s["_" + e];
				var a = [], o = 0;
				if (r) for (var c = 0; c < r.length; c++) {
					var l = i[n[c]];
					l ? (o === 0 && (o = Lt()), a[c] = l(r[c])) : a[c] = r[c];
				}
				return n = e(...a), n = function(e) {
					return o !== 0 && It(o), t === "string" ? j(e) : t === "boolean" ? !!e : e;
				}(n);
			}, Dt = (e) => {
				var t = M(e) + 1, n = Nt(t);
				return n && N(e, y, n, t), n;
			}, Y, Ot = [], X = (e) => {
				Y.delete($.get(e)), $.set(e, null), Ot.push(e);
			}, kt = (e) => {
				let t = e.length;
				return [
					t % 128 | 128,
					t >> 7,
					...e
				];
			}, At = {
				i: 127,
				p: 127,
				j: 126,
				f: 125,
				d: 124,
				e: 111
			}, jt = (e) => kt(Array.from(e, (e) => At[e])), Mt = (e, t) => {
				if (!Y) {
					Y = /* @__PURE__ */ new WeakMap();
					var n = $.length;
					if (Y) for (var r = 0; r < 0 + n; r++) {
						var i = $.get(r);
						i && Y.set(i, r);
					}
				}
				if (n = Y.get(e) || 0) return n;
				n = Ot.length ? Ot.pop() : $.grow(1);
				try {
					$.set(n, e);
				} catch (r) {
					if (!(r instanceof TypeError)) throw r;
					t = Uint8Array.of(0, 97, 115, 109, 1, 0, 0, 0, 1, ...kt([
						1,
						96,
						...jt(t.slice(1)),
						...jt(t[0] === "v" ? "" : t[0])
					]), 2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0), t = new WebAssembly.Module(t), t = new WebAssembly.Instance(t, { e: { f: e } }).exports.f, $.set(n, t);
				}
				return Y.set(e, n), n;
			};
			if (I = Array(4096), $e(P, "/"), U("/tmp"), U("/home"), U("/home/web_user"), (function() {
				U("/dev"), Qe(259, {
					read: () => 0,
					write: (e, t, n, r) => r,
					Va: () => 0
				}), nt("/dev/null", 259), ke(1280, je), ke(1536, Me), nt("/dev/tty", 1280), nt("/dev/tty1", 1536);
				var e = new Uint8Array(1024), t = 0, n = () => (t === 0 && (we(e), t = e.byteLength), e[--t]);
				K("random", n), K("urandom", n), U("/dev/shm"), U("/dev/shm/tmp");
			})(), (function() {
				U("/proc");
				var e = U("/proc/self");
				U("/proc/self/fd"), $e({ Xa() {
					var t = We(e, "fd", 16895, 73);
					return t.Ma = { Va: P.Ma.Va }, t.La = {
						lookup(e, t) {
							e = +t;
							var n = H(e);
							return e = {
								parent: null,
								Xa: { Db: "fake" },
								La: { readlink: () => n.path },
								id: e + 1
							}, e.parent = e;
						},
						readdir() {
							return Array.from(F.entries()).filter(([, e]) => e).map(([e]) => e.toString());
						}
					}, t;
				} }, "/proc/self/fd");
			})(), s.noExitRuntime && (O = s.noExitRuntime), s.print && (re = s.print), s.printErr && (h = s.printErr), s.wasmBinary && (g = s.wasmBinary), s.thisProgram && (ee = s.thisProgram), s.preInit) for (typeof s.preInit == "function" && (s.preInit = [s.preInit]); 0 < s.preInit.length;) s.preInit.shift()();
			s.stackSave = () => Lt(), s.stackRestore = (e) => It(e), s.stackAlloc = (e) => Q(e), s.cwrap = (e, t, n, r) => {
				var i = !n || n.every((e) => e === "number" || e === "boolean");
				return t !== "string" && i && !r ? s["_" + e] : (...r) => Et(e, t, n, r);
			}, s.addFunction = Mt, s.removeFunction = X, s.UTF8ToString = j, s.stringToNewUTF8 = Dt, s.writeArrayToMemory = (e, t) => {
				v.set(e, t);
			};
			var Nt, Z, Pt, Ft, It, Q, Lt, Rt, $, zt = {
				a: (e, t, n, r) => w(`Assertion failed: ${j(e)}, at: ` + [
					t ? j(t) : "unknown filename",
					n,
					r ? j(r) : "unknown function"
				]),
				i: function(e, t) {
					try {
						return e = j(e), st(e, t), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				L: function(e, t, n) {
					try {
						if (t = j(t), t = J(e, t), n & -8) return -28;
						var r = R(t, { ab: !0 }).node;
						return r ? (e = "", n & 4 && (e += "r"), n & 2 && (e += "w"), n & 1 && (e += "x"), e && V(r, e) ? -2 : 0) : -44;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				j: function(e, t) {
					try {
						var n = H(e);
						return ot(n, n.node, t, !1), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				h: function(e) {
					try {
						var t = H(e);
						return Xe(t, t.node, {
							timestamp: Date.now(),
							Lb: !1
						}), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				b: function(e, t, n) {
					ht = n;
					try {
						var r = H(e);
						switch (t) {
							case 0:
								var i = gt();
								if (0 > i) break;
								for (; F[i];) i++;
								return Ye(r, i).fd;
							case 1:
							case 2: return 0;
							case 3: return r.flags;
							case 4: return i = gt(), r.flags |= i, 0;
							case 12: return i = gt(), b[i + 0 >> 1] = 2, 0;
							case 13:
							case 14: return 0;
						}
						return -28;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				g: function(e, t) {
					try {
						var n = H(e), r = n.node, i = n.Ma.Ta;
						return e = i ? n : r, i ??= r.La.Ta, qe(i), mt(t, i(e));
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				H: function(e, t) {
					t = -9007199254740992 > t || 9007199254740992 < t ? NaN : Number(t);
					try {
						if (isNaN(t)) return -61;
						var n = H(e);
						if (0 > t || !(n.flags & 2097155)) throw new L(28);
						return ct(n, n.node, t), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				G: function(e, t) {
					try {
						if (t === 0) return -28;
						var n = M("/") + 1;
						return t < n ? -68 : (N("/", y, e, t), n);
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				K: function(e, t) {
					try {
						return e = j(e), mt(t, W(e, !0));
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				C: function(e, t, n) {
					try {
						return t = j(t), t = J(e, t), U(t, n), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				J: function(e, t, n, r) {
					try {
						t = j(t);
						var i = r & 256;
						return t = J(e, t, r & 4096), mt(n, i ? W(t, !0) : W(t));
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				x: function(e, t, n, r) {
					ht = r;
					try {
						t = j(t), t = J(e, t);
						var i = r ? gt() : 0;
						return G(t, n, i).fd;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				v: function(e, t, n, r) {
					try {
						if (t = j(t), t = J(e, t), 0 >= r) return -28;
						var i = R(t).node;
						if (!i) throw new L(44);
						if (!i.La.readlink) throw new L(28);
						var a = i.La.readlink(i), o = Math.min(r, M(a)), s = v[n + o];
						return N(a, y, n, r + 1), v[n + o] = s, o;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				u: function(e) {
					try {
						return e = j(e), it(e), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				f: function(e, t) {
					try {
						return e = j(e), mt(t, W(e));
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				r: function(e, t, n) {
					try {
						if (t = j(t), t = J(e, t), n) if (n === 512) it(t);
						else return -28;
						else at(t);
						return 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				q: function(e, t, n) {
					try {
						t = j(t), t = J(e, t, !0);
						var r = Date.now(), i, a;
						if (n) {
							var o = S[n >> 2] + 4294967296 * x[n + 4 >> 2], s = x[n + 8 >> 2];
							i = s == 1073741823 ? r : s == 1073741822 ? null : 1e3 * o + s / 1e6, n += 16, o = S[n >> 2] + 4294967296 * x[n + 4 >> 2], s = x[n + 8 >> 2], a = s == 1073741823 ? r : s == 1073741822 ? null : 1e3 * o + s / 1e6;
						} else a = i = r;
						if ((a ?? i) !== null) {
							e = i;
							var c = R(t, { ab: !0 }).node;
							qe(c.La.Ua)(c, {
								atime: e,
								mtime: a
							});
						}
						return 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				m: () => w(""),
				l: () => {
					O = !1, _t = 0;
				},
				A: function(e, t) {
					e = -9007199254740992 > e || 9007199254740992 < e ? NaN : Number(e), e = /* @__PURE__ */ new Date(1e3 * e), x[t >> 2] = e.getSeconds(), x[t + 4 >> 2] = e.getMinutes(), x[t + 8 >> 2] = e.getHours(), x[t + 12 >> 2] = e.getDate(), x[t + 16 >> 2] = e.getMonth(), x[t + 20 >> 2] = e.getFullYear() - 1900, x[t + 24 >> 2] = e.getDay();
					var n = e.getFullYear();
					x[t + 28 >> 2] = (n % 4 != 0 || n % 100 == 0 && n % 400 != 0 ? yt : vt)[e.getMonth()] + e.getDate() - 1 | 0, x[t + 36 >> 2] = -(60 * e.getTimezoneOffset()), n = new Date(e.getFullYear(), 6, 1).getTimezoneOffset();
					var r = new Date(e.getFullYear(), 0, 1).getTimezoneOffset();
					x[t + 32 >> 2] = (n != r && e.getTimezoneOffset() == Math.min(r, n)) | 0;
				},
				y: function(e, t, n, r, i, a, o) {
					i = -9007199254740992 > i || 9007199254740992 < i ? NaN : Number(i);
					try {
						var s = H(r);
						if (t & 2 && !(n & 2) && (s.flags & 2097155) != 2 || (s.flags & 2097155) == 1) throw new L(2);
						if (!s.Ma.jb) throw new L(43);
						if (!e) throw new L(28);
						var c = s.Ma.jb(s, e, i, t, n), l = c.Xb;
						return x[a >> 2] = c.Eb, S[o >> 2] = l, 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				z: function(e, t, n, r, i, a) {
					a = -9007199254740992 > a || 9007199254740992 < a ? NaN : Number(a);
					try {
						var o = H(i);
						if (n & 2) {
							if (n = a, (o.node.mode & 61440) != 32768) throw new L(43);
							if (!(r & 2)) {
								var s = y.slice(e, e + t);
								o.Ma.kb && o.Ma.kb(o, s, n, t, r);
							}
						}
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return -e.Pa;
					}
				},
				n: (e, t) => (bt[e] && (clearTimeout(bt[e].id), delete bt[e]), t && (bt[e] = {
					id: setTimeout(() => {
						delete bt[e], St(() => Ft(e, performance.now()));
					}, t),
					lc: t
				}), 0),
				B: (e, t, n, r) => {
					var i = (/* @__PURE__ */ new Date()).getFullYear(), a = new Date(i, 0, 1).getTimezoneOffset();
					i = new Date(i, 6, 1).getTimezoneOffset(), S[e >> 2] = 60 * Math.max(a, i), x[t >> 2] = Number(a != i), t = (e) => {
						var t = Math.abs(e);
						return `UTC${0 <= e ? "-" : "+"}${String(Math.floor(t / 60)).padStart(2, "0")}${String(t % 60).padStart(2, "0")}`;
					}, e = t(a), t = t(i), i < a ? (N(e, y, n, 17), N(t, y, r, 17)) : (N(e, y, r, 17), N(t, y, n, 17));
				},
				d: () => Date.now(),
				s: () => 2147483648,
				c: () => performance.now(),
				o: (e) => {
					var t = y.length;
					if (e >>>= 0, 2147483648 < e) return !1;
					for (var n = 1; 4 >= n; n *= 2) {
						var r = t * (1 + .2 / n);
						r = Math.min(r, e + 100663296);
						a: {
							r = (Math.min(2147483648, 65536 * Math.ceil(Math.max(e, r) / 65536)) - Rt.buffer.byteLength + 65535) / 65536 | 0;
							try {
								Rt.grow(r), ce();
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
					for (i of wt()) {
						var a = t + n;
						S[e + r >> 2] = a, n += N(i, y, a, Infinity) + 1, r += 4;
					}
					return 0;
				},
				F: (e, t) => {
					var n = wt();
					S[e >> 2] = n.length, e = 0;
					for (var r of n) e += M(r) + 1;
					return S[t >> 2] = e, 0;
				},
				e: function(e) {
					try {
						return lt(H(e)), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				p: function(e, t) {
					try {
						var n = H(e);
						return v[t] = n.tty ? 2 : B(n.mode) ? 3 : (n.mode & 61440) == 40960 ? 7 : 4, b[t + 2 >> 1] = 0, C[t + 8 >> 3] = BigInt(0), C[t + 16 >> 3] = BigInt(0), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				w: function(e, t, n, r) {
					try {
						a: {
							var i = H(e);
							e = t;
							for (var a, o = t = 0; o < n; o++) {
								var s = S[e >> 2], c = S[e + 4 >> 2];
								e += 8;
								var l = dt(i, v, s, c, a);
								if (0 > l) {
									var u = -1;
									break a;
								}
								if (t += l, l < c) break;
								a !== void 0 && (a += l);
							}
							u = t;
						}
						return S[r >> 2] = u, 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				D: function(e, t, n, r) {
					t = -9007199254740992 > t || 9007199254740992 < t ? NaN : Number(t);
					try {
						if (isNaN(t)) return 61;
						var i = H(e);
						return ut(i, t, n), C[r >> 3] = BigInt(i.position), i.rb && t === 0 && n === 0 && (i.rb = null), 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				I: function(e) {
					try {
						var t = H(e);
						return t.Ma?.fsync?.(t);
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				t: function(e, t, n, r) {
					try {
						a: {
							var i = H(e);
							e = t;
							for (var a, o = t = 0; o < n; o++) {
								var s = S[e >> 2], c = S[e + 4 >> 2];
								e += 8;
								var l = ft(i, v, s, c, a);
								if (0 > l) {
									var u = -1;
									break a;
								}
								if (t += l, l < c) break;
								a !== void 0 && (a += l);
							}
							u = t;
						}
						return S[r >> 2] = u, 0;
					} catch (e) {
						if (q === void 0 || e.name !== "ErrnoError") throw e;
						return e.Pa;
					}
				},
				k: xt
			};
			function Bt() {
				function e() {
					if (s.calledRun = !0, !_) {
						if (!s.noFSInit && !Le) {
							var e, t;
							Le = !0, e ??= s.stdin, t ??= s.stdout, n ??= s.stderr, e ? K("stdin", e) : rt("/dev/tty", "/dev/stdin"), t ? K("stdout", null, t) : rt("/dev/tty", "/dev/stdout"), n ? K("stderr", null, n) : rt("/dev/tty1", "/dev/stderr"), G("/dev/stdin", 0), G("/dev/stdout", 1), G("/dev/stderr", 1);
						}
						if (Vt.N(), Re = !1, s.onRuntimeInitialized?.(), s.postRun) for (typeof s.postRun == "function" && (s.postRun = [s.postRun]); s.postRun.length;) {
							var n = s.postRun.shift();
							he.push(n);
						}
						me(he);
					}
				}
				if (0 < T) E = Bt;
				else {
					if (s.preRun) for (typeof s.preRun == "function" && (s.preRun = [s.preRun]); s.preRun.length;) _e();
					me(ge), 0 < T ? E = Bt : s.setStatus ? (s.setStatus("Running..."), setTimeout(() => {
						setTimeout(() => s.setStatus(""), 1), e();
					}, 1)) : e();
				}
			}
			var Vt;
			return (async function() {
				function e(e) {
					return e = Vt = e.exports, s._sqlite3_free = e.P, s._sqlite3_value_text = e.Q, s._sqlite3_prepare_v2 = e.R, s._sqlite3_step = e.S, s._sqlite3_reset = e.T, s._sqlite3_exec = e.U, s._sqlite3_finalize = e.V, s._sqlite3_column_name = e.W, s._sqlite3_column_text = e.X, s._sqlite3_column_type = e.Y, s._sqlite3_errmsg = e.Z, s._sqlite3_clear_bindings = e._, s._sqlite3_value_blob = e.$, s._sqlite3_value_bytes = e.aa, s._sqlite3_value_double = e.ba, s._sqlite3_value_int = e.ca, s._sqlite3_value_type = e.da, s._sqlite3_result_blob = e.ea, s._sqlite3_result_double = e.fa, s._sqlite3_result_error = e.ga, s._sqlite3_result_int = e.ha, s._sqlite3_result_int64 = e.ia, s._sqlite3_result_null = e.ja, s._sqlite3_result_text = e.ka, s._sqlite3_aggregate_context = e.la, s._sqlite3_column_count = e.ma, s._sqlite3_data_count = e.na, s._sqlite3_column_blob = e.oa, s._sqlite3_column_bytes = e.pa, s._sqlite3_column_double = e.qa, s._sqlite3_bind_blob = e.ra, s._sqlite3_bind_double = e.sa, s._sqlite3_bind_int = e.ta, s._sqlite3_bind_text = e.ua, s._sqlite3_bind_parameter_index = e.va, s._sqlite3_sql = e.wa, s._sqlite3_normalized_sql = e.xa, s._sqlite3_changes = e.ya, s._sqlite3_close_v2 = e.za, s._sqlite3_create_function_v2 = e.Aa, s._sqlite3_update_hook = e.Ba, s._sqlite3_open = e.Ca, Nt = s._malloc = e.Da, Z = s._free = e.Ea, s._RegisterExtensionFunctions = e.Fa, Pt = e.Ga, Ft = e.Ha, It = e.Ia, Q = e.Ja, Lt = e.Ka, Rt = e.M, $ = e.O, ce(), T--, s.monitorRunDependencies?.(T), T == 0 && E && (e = E, E = null, e()), Vt;
				}
				T++, s.monitorRunDependencies?.(T);
				var t = { a: zt };
				return s.instantiateWasm ? new Promise((n) => {
					s.instantiateWasm(t, (t, r) => {
						n(e(t, r));
					});
				}) : (le ??= s.locateFile ? s.locateFile("sql-wasm.wasm", ne) : ne + "sql-wasm.wasm", e((await fe(t)).instance));
			})(), Bt(), a;
		}), r);
	};
	typeof t == "object" && typeof n == "object" ? (n.exports = i, n.exports.default = i) : typeof define == "function" && define.amd ? define([], function() {
		return i;
	}) : typeof t == "object" && (t.Module = i);
}));
//#endregion
export default n();
export {};
