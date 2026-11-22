import { css } from "lit";

export const cardStyles = css`
  :host {
    display: block;
    font-family: var(--evc-typography-fontFamily, inherit);
  }
  ha-card {
    display: block;
    position: relative;
    box-sizing: border-box;
    overflow: hidden;
    border-radius: var(--evc-radius-card);
    padding: var(--evc-spacing-cardPadding);
    isolation: isolate;
    background: var(--evc-color-ha-cardBackground);
    transition: box-shadow .3s;
  }
  ha-card::before {
    content: "";
    position: absolute;
    inset: var(--evc-components-card-glowInset, -40% -20% auto auto);
    width: var(--evc-components-card-glowSize, 320px);
    height: var(--evc-components-card-glowSize, 320px);
    z-index: -1;
    background: var(--evc-components-card-glowGradient, radial-gradient(circle, var(--tone, transparent) 0%, transparent 65%));
    opacity: var(--evc-color-tint-cardGlowOpacity, .18);
    transition: background .6s;
  }
  ha-card.rcard { border-top: 4px solid var(--accent, var(--tone, transparent)); }
  ha-card.rcard {
    background-image: linear-gradient(color-mix(in srgb, var(--accent, var(--tone, transparent)) 7%, transparent), transparent 120px);
  }
  .top {
    display: flex;
    align-items: center;
    gap: var(--evc-spacing-topGap);
    flex-wrap: nowrap;
    min-width: 0;
  }
  .name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: var(--evc-typography-name-size, 1.15rem);
    font-weight: 600;
    letter-spacing: -.01em;
    color: var(--evc-color-ha-textPrimary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--evc-spacing-chipGap);
    margin-top: 7px;
    min-width: 0;
  }
  .chips:empty { display: none; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: var(--evc-spacing-chipPadding);
    border-radius: var(--evc-radius-pill);
    font-size: .82rem;
    font-weight: 600;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    white-space: nowrap;
    flex: 0 1 auto;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chip ha-icon { --mdc-icon-size: 16px; flex: none; }
  .chip.compact { padding: var(--evc-spacing-chipPaddingCompact); font-size: .76rem; }
  .now {
    font-size: clamp(2.1rem, 17cqw, 3.1rem);
    font-weight: 300;
    letter-spacing: -.04em;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--evc-color-ha-textPrimary);
  }
  .now small {
    font-size: .42em;
    vertical-align: super;
    margin-left: 2px;
    color: var(--evc-color-ha-textSecondary);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(var(--evc-spacing-statMin), 1fr));
    gap: var(--evc-spacing-statGap);
    margin-top: var(--evc-spacing-statsMarginTop);
  }
  .stat {
    border-radius: var(--evc-radius-stat);
    padding: var(--evc-spacing-statPadding);
    background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
  }
  .stat .l {
    font-size: .72rem;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: var(--evc-color-ha-textSecondary);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .stat .l ha-icon { --mdc-icon-size: 14px; }
  .stat .v {
    font-size: 1.05rem;
    font-weight: 600;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
    color: var(--evc-color-ha-textPrimary);
  }
  .stat .v.tone { color: var(--st, var(--tone)); }
  .stat .v small { font-size: .75rem; font-weight: 500; color: var(--evc-color-ha-textSecondary); margin-left: 4px; }
  .banner {
    margin-top: 16px;
    border-radius: var(--evc-radius-banner);
    padding: var(--evc-spacing-bannerPadding);
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--vt);
    background: color-mix(in srgb, var(--vt) 13%, transparent);
    font-weight: 600;
    font-size: .9rem;
  }
  .banner .grow { flex: 1; }
  .bar {
    height: 6px;
    border-radius: var(--evc-radius-bar);
    background: color-mix(in srgb, var(--vt) 18%, transparent);
    overflow: hidden;
    margin-top: 8px;
  }
  .bar > i {
    display: block;
    height: 100%;
    background: var(--vt);
    border-radius: var(--evc-radius-bar);
    transition: width 1s linear;
  }
  .tip {
    position: absolute;
    top: 6px;
    pointer-events: none;
    padding: var(--evc-spacing-tipPadding);
    border-radius: var(--evc-radius-xl);
    font-size: .8rem;
    min-width: 150px;
    background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color)) 92%, transparent);
    backdrop-filter: blur(8px);
    box-shadow: var(--evc-shadow-tip);
    border: 1px solid color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    color: var(--evc-color-ha-textPrimary);
  }
  .tip .t { font-weight: 650; margin-bottom: 6px; color: var(--evc-color-ha-textSecondary); }
  .tip .r { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
  .tip .r span { display: flex; align-items: center; gap: 6px; }
  .tip .r i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
  .tip .r b { font-variant-numeric: tabular-nums; }
  .qm {
    all: unset;
    cursor: pointer;
    flex: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: inline-grid;
    place-items: center;
    font-size: .72rem;
    font-weight: 700;
    color: var(--evc-color-ha-textSecondary);
    border: 1px solid color-mix(in srgb, var(--primary-text-color) 25%, transparent);
  }
  .qm:hover, .qm.on { color: #fff; background: var(--g, var(--evc-color-status-air)); border-color: var(--g, var(--evc-color-status-air)); }
  .qm:focus-visible { outline: 2px solid var(--g, var(--evc-color-status-air)); outline-offset: 2px; }
  .dial {
    position: relative;
    display: grid;
    place-items: center;
    margin: 8px auto 4px;
    width: min(240px, 100%);
    aspect-ratio: 1 / 0.82;
    container-type: inline-size;
  }
  .dial svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
  .dial .track { stroke: color-mix(in srgb, var(--primary-text-color) 9%, transparent); }
  .dial .fill {
    stroke: var(--tone);
    transition: stroke-dasharray .6s ease, stroke .6s;
    filter: var(--evc-shadow-dialFill);
  }
  .dial .knob {
    fill: var(--ha-card-background, var(--card-background-color));
    stroke: var(--tone);
    stroke-width: 3;
    filter: var(--evc-shadow-knob);
  }
  .dial .dot { fill: var(--tone); }
  .dial .fill.muted { stroke: var(--evc-color-status-off); filter: none; opacity: .5; }
  .dial .scale { font-size: 10px; fill: var(--evc-color-ha-textSecondary); }
  .dial .tlabel { font-size: 11px; font-weight: 600; fill: var(--tone); }
  .chart { position: relative; height: var(--h, 240px); margin-top: 6px; }
  .chart svg { width: 100%; height: 100%; overflow: visible; display: block; }
  .grid line {
    stroke: color-mix(in srgb, var(--primary-text-color) 8%, transparent);
    stroke-dasharray: 3 5;
  }
  .ylab, .xlab {
    font-size: 10.5px;
    fill: var(--evc-color-ha-textSecondary);
    font-variant-numeric: tabular-nums;
  }
  .line {
    fill: none;
    stroke: var(--c, var(--tone));
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: opacity .2s;
  }
  .hover-line { stroke: color-mix(in srgb, var(--primary-text-color) 35%, transparent); stroke-width: 1; }
  button:focus-visible, summary:focus-visible {
    outline: 2px solid var(--evc-color-status-air);
    outline-offset: 2px;
  }
  .err { padding: 16px; color: var(--evc-color-status-cold); }
  .empty { padding: 40px 0; text-align: center; color: var(--evc-color-ha-textSecondary); }
  .main { text-align: center; margin: 16px 0 2px; }
  .target { margin-top: 6px; font-size: .82rem; line-height: 1.25; color: var(--evc-color-ha-textSecondary); font-variant-numeric: tabular-nums; }
  .target b { color: var(--evc-color-ha-textPrimary); font-weight: 600; }
  .helpbox {
    margin: 10px 0 4px;
    padding: 10px 12px;
    border-radius: var(--evc-radius-lg);
    font-size: .88rem;
    line-height: 1.45;
    color: var(--evc-color-ha-textPrimary);
    background: color-mix(in srgb, var(--g, var(--evc-color-status-air)) 10%, var(--ha-card-background, var(--card-background-color)));
    border-left: 3px solid var(--g, var(--evc-color-status-air));
  }
  .lps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 12px;
    margin-top: 10px;
  }
  .lp { min-width: 0; }
  .center { text-align: center; z-index: 1; margin-top: -6px; max-width: 58%; min-width: 0; }
  .gridline { stroke: color-mix(in srgb, var(--primary-text-color) 8%, transparent); stroke-dasharray: 3 5; }
  .ylabh {
    position: absolute;
    left: 2px;
    transform: translateY(-50%);
    font-size: 10.5px;
    color: var(--evc-color-ha-textSecondary);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .xlabh {
    position: absolute;
    bottom: 0;
    transform: translateX(-50%);
    font-size: 10.5px;
    color: var(--evc-color-ha-textSecondary);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .tleg { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 14px; font-size: .78rem; color: var(--evc-color-ha-textSecondary); }
  .tleg span { display: inline-flex; align-items: center; gap: 6px; }
  .tleg i { width: 14px; height: 10px; border-radius: 3px; background: var(--c); }
  .carwrap { display: flex; align-items: center; gap: 18px; margin-top: 14px; }
  .carimg {
    width: 132px;
    height: 88px;
    object-fit: cover;
    border-radius: var(--evc-radius-xl);
    flex: none;
    background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
  }
  .caricon { --mdc-icon-size: 84px; color: var(--tone); flex: none; }
  .carinfo { min-width: 0; flex: 1; }
  .range {
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -.02em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
    color: var(--evc-color-ha-textPrimary);
    margin-top: 6px;
  }
  .range small { font-size: .5em; font-weight: 500; color: var(--evc-color-ha-textSecondary); margin-left: 2px; }
  .evlist { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
  .evrow {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--evc-radius-stat);
    background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
  }
  .evdate {
    flex: none;
    width: 46px;
    text-align: center;
    border-radius: 10px;
    padding: 4px 0;
    background: color-mix(in srgb, var(--c, var(--tone)) 14%, transparent);
  }
  .evdate b { display: block; font-size: 1.05rem; font-variant-numeric: tabular-nums; color: var(--evc-color-ha-textPrimary); }
  .evdate span { font-size: .66rem; text-transform: uppercase; letter-spacing: .05em; color: var(--evc-color-ha-textSecondary); }
  .evmain { flex: 1; min-width: 0; }
  .evsum { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--evc-color-ha-textPrimary); }
  .evtime { font-size: .78rem; color: var(--evc-color-ha-textSecondary); margin-top: 2px; }
  .evdot { flex: none; width: 10px; height: 10px; border-radius: 50%; background: var(--c, var(--tone)); }
  .evday { font-weight: 600; font-size: .9rem; color: var(--evc-color-ha-textSecondary); }
  .evgroup {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    font-weight: 650;
    font-size: .92rem;
    color: var(--evc-color-ha-textPrimary);
  }
  .evgroup:first-child { margin-top: 10px; }
  .evgroup i { width: 10px; height: 10px; border-radius: 50%; background: var(--c); flex: none; }
  .evgroup .gname { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .evgroup em { font-style: normal; font-size: .75rem; color: var(--evc-color-ha-textSecondary); font-variant-numeric: tabular-nums; }
  .evempty { padding: 6px 2px 10px; font-size: .82rem; color: var(--evc-color-ha-textSecondary); }
  .calleg { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; font-size: .78rem; color: var(--evc-color-ha-textSecondary); }
  .calleg span { display: inline-flex; align-items: center; gap: 6px; }
  .calleg i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
  .calhead { display: flex; align-items: center; gap: 6px; margin-top: 12px; }
  .calhead .m { flex: 1; text-align: center; font-weight: 600; color: var(--evc-color-ha-textPrimary); }
  .calnav {
    all: unset;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: .8rem;
    color: var(--evc-color-ha-textPrimary);
  }
  .calnav:hover { background: color-mix(in srgb, var(--primary-text-color) 8%, transparent); }
  .calgrid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 8px; }
  .calgrid .wd {
    text-align: center;
    font-size: .66rem;
    text-transform: uppercase;
    letter-spacing: .05em;
    color: var(--evc-color-ha-textSecondary);
    padding: 2px 0;
  }
  .calcell {
    all: unset;
    cursor: pointer;
    aspect-ratio: 1;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    font-size: .85rem;
    font-variant-numeric: tabular-nums;
    color: var(--evc-color-ha-textPrimary);
  }
  .calcell.out { color: var(--evc-color-ha-textSecondary); opacity: .45; }
  .calcell.today { font-weight: 700; box-shadow: inset 0 0 0 1.5px var(--tone); }
  .calcell.sel { background: color-mix(in srgb, var(--tone) 16%, transparent); font-weight: 700; }
  .calcell .dots { display: flex; align-items: center; gap: 3px; height: 5px; }
  .calcell .dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--c); }
  .calcell .dots em { font-size: .62rem; font-style: normal; color: var(--evc-color-ha-textSecondary); }
  .wlist { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
  .wrow {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--evc-radius-stat);
    background: color-mix(in srgb, var(--primary-text-color) 5%, transparent);
    border: 1.5px solid transparent;
  }
  .wrow.wnext {
    border-color: var(--wc, var(--tone));
    background: color-mix(in srgb, var(--wc, var(--tone)) 10%, transparent);
  }
  .wicon { --mdc-icon-size: 26px; color: var(--wc, var(--tone)); flex: none; }
  .winfo { flex: 1; min-width: 0; }
  .wname { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--evc-color-ha-textPrimary); }
  .wdate { font-size: .78rem; color: var(--evc-color-ha-textSecondary); margin-top: 2px; font-variant-numeric: tabular-nums; }
  .wnum { flex: none; text-align: right; line-height: 1.05; }
  .wnum b { font-size: 1.5rem; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--evc-color-ha-textPrimary); }
  .wnum span { font-size: .72rem; color: var(--evc-color-ha-textSecondary); margin-left: 3px; }
  .wnum em { display: block; font-style: normal; font-size: .72rem; font-weight: 600; color: var(--wc, var(--tone)); margin-top: 2px; }
  .wchip { position: absolute; top: -9px; right: 10px; color: #fff; background: var(--wc, var(--tone)); }
  .wnote { margin-top: 10px; font-size: .78rem; color: var(--evc-color-ha-textSecondary); }
`;
