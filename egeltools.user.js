// ==UserScript==
// @name         EgelTools
// @version      0.33.0
// @description  A focused Grepolis toolkit with town, collection, attack, farming-village, and troop-queue tools.
// @author       Egelman
// @match        *://*.grepolis.com/game/*
// @include      https://*.grepolis.com/game/*
// @icon         data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Cg stroke='%23071a38' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath fill='%231676d2' d='M6 43c0-8.2 5.3-15.4 13.7-19.4l-7.2-5.8 11.1.5-1.2-9.5 8.5 7.5L36.7 6l4 11.1 10.6-6.5-3 13.2c6.4 3.2 10.2 8.4 10.2 14.3 0 11.1-12.1 18.1-29.8 18.1H18C10.6 56.2 6 51.2 6 43Z'/%3E%3Cpath fill='%23f2bd73' d='M34.1 53.8c-1.7-10.6 2-20 11-25.4 4.6-2.7 10.3-.8 12.4 4l2.2 5.1-5.4 2.6c-.7 7-7.4 12.1-20.2 13.7Z'/%3E%3Cellipse cx='50.4' cy='29.4' rx='3.5' ry='5.2' fill='white'/%3E%3Ccircle cx='59.2' cy='37.4' r='3.1' fill='%23071a38' stroke='none'/%3E%3C/g%3E%3C/svg%3E
// @grant        none
// @run-at       document-idle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const APP = Object.freeze({
    name: 'EgelTools',
    version: '0.33.0',
    launcherId: 'egeltools-launcher',
    toolDockId: 'egeltools-tool-dock',
    toolDockActionsId: 'egeltools-tool-dock-actions',
    toolDockSettingsButtonId: 'egeltools-tool-dock-settings',
    windowId: 'egeltools-settings-window',
    styleId: 'egeltools-styles',
  });

  const COLLECT_ALARM = Object.freeze({
    soundUrl: 'https://files.miro23.uk/sounds/bd.mp3',
    captainStartupGraceDuration: 15 * 1000,
    fallbackDuration: 10 * 60 * 1000,
    allowedDurations: new Set([600, 2400, 10800, 28800]),
    collectButtonSelector: '#fto_claim_button',
    stopButtonSelector: '.boerendorpKnop',
    repeatAnchorSelector: '.strategic_map.circle_button',
    activeTimeSelector: '#time_options_wrapper .fto_time_checkbox.active',
    repeatButtonId: 'm23-repeat-btn',
    fallbackStopButtonId: 'egeltools-farm-alarm-stop',
    targetKey: 'm23_alarm_target',
    stateKey: 'm23_alarm_state',
    repeatKey: 'm23_alarm_repeat',
  });

  const ATTACK_ALARM = Object.freeze({
    defaultSoundUrl: 'https://cdn.grcrt.net/ui/s/alarm.mp3',
    soundKey: 'm23_alarm_sound_url',
    soundInputId: 'egeltools-alarm-sound-url',
    soundSaveButtonId: 'egeltools-alarm-sound-save',
    soundDefaultButtonId: 'egeltools-alarm-sound-default',
    soundTestButtonId: 'egeltools-alarm-sound-test',
    soundStatusId: 'egeltools-alarm-sound-status',
    youtubePlayerId: 'egeltools-alarm-youtube-player',
    youtubeTestPlayerId: 'egeltools-alarm-youtube-test-player',
    soundChangedEvent: 'egeltools:alarm-sound-changed',
    enabledKey: 'egeltools_attack_alarm_enabled',
    mutedPlayersKey: 'egeltools_attack_alarm_muted_players',
    minimumPointsKey: 'egeltools_attack_alarm_minimum_points',
    delayEnabledKey: 'egeltools_attack_alarm_delay_enabled',
    delayStartKey: 'egeltools_attack_alarm_delay_start',
    delayEndKey: 'egeltools_attack_alarm_delay_end',
    enabledInputId: 'egeltools-attack-alarm-enabled',
    mutedPlayersInputId: 'egeltools-attack-alarm-muted-players',
    minimumPointsInputId: 'egeltools-attack-alarm-minimum-points',
    delayEnabledInputId: 'egeltools-attack-alarm-delay-enabled',
    delayStartInputId: 'egeltools-attack-alarm-delay-start',
    delayEndInputId: 'egeltools-attack-alarm-delay-end',
    statusId: 'egeltools-attack-alarm-status',
    stopButtonId: 'egeltools-attack-alarm-stop',
    settingsChangedEvent: 'egeltools:attack-alarm-settings-changed',
    delayDuration: 20 * 1000,
    startupSilenceDuration: 5 * 1000,
    pollInterval: 1000,
    playerDataTtl: 6 * 60 * 60 * 1000,
  });

  const CELEBRATION_FINDER = Object.freeze({
    panelId: 'egeltools-celebration-finder',
    bodyId: 'egeltools-celebration-finder-body',
    floatingButtonId: 'egeltools-celebration-finder-button',
    bulkActionsId: 'egeltools-celebration-finder-bulk-actions',
    refreshButtonId: 'egeltools-celebration-finder-refresh',
    closeButtonId: 'egeltools-celebration-finder-close',
    olympicsSettingId: 'egeltools-celebration-olympics-enabled',
    olympicsEnabledKey: 'egeltools_celebration_olympics_enabled',
    olympicsGoldCost: 50,
    partyStorageRequired: 18000,
    academyPartyLevel: 30,
    theaterStorageRequired: 12000,
    academyTheaterLevel: 30,
    refreshInterval: 10 * 1000,
  });

  const TOWN_DISTANCE_SORTER = Object.freeze({
    panelId: 'egeltools-town-distance-sorter',
    bodyId: 'egeltools-town-distance-sorter-body',
    floatingButtonId: 'egeltools-town-distance-sorter-button',
    refreshButtonId: 'egeltools-town-distance-sorter-refresh',
    closeButtonId: 'egeltools-town-distance-sorter-close',
    mapTileSize: 128,
    retryInterval: 1000,
  });

  const RESOURCE_CHECKER = Object.freeze({
    panelId: 'egeltools-resource-checker',
    bodyId: 'egeltools-resource-checker-body',
    floatingButtonId: 'egeltools-resource-checker-button',
    countId: 'egeltools-resource-checker-count',
    refreshButtonId: 'egeltools-resource-checker-refresh',
    closeButtonId: 'egeltools-resource-checker-close',
    applyButtonId: 'egeltools-resource-checker-apply',
    sorterId: 'egeltools-resource-checker-sorter',
    thresholds: Object.freeze({
      wood: Object.freeze({
        defaultValue: 15000,
        inputId: 'egeltools-resource-checker-wood',
        storageKey: 'egeltools_resource_checker_min_wood',
      }),
      stone: Object.freeze({
        defaultValue: 18000,
        inputId: 'egeltools-resource-checker-stone',
        storageKey: 'egeltools_resource_checker_min_stone',
      }),
      iron: Object.freeze({
        defaultValue: 15000,
        inputId: 'egeltools-resource-checker-iron',
        storageKey: 'egeltools_resource_checker_min_iron',
      }),
    }),
    refreshInterval: 10 * 1000,
    maximumDonorsPerTown: 5,
    loyaltyClaimInterval: 13 * 60,
    loyaltyClaimByFarmLevel: Object.freeze([0, 28, 34, 40, 45, 51, 57]),
  });

  const BD_LEVEL_CHECK = Object.freeze({
    panelId: 'egeltools-bd-level-check',
    bodyId: 'egeltools-bd-level-check-body',
    countId: 'egeltools-bd-level-check-count',
    toggleId: 'egeltools-bd-level-check-toggle',
    refreshId: 'egeltools-bd-level-check-refresh',
    collapsedKey: 'egeltools_bd_level_check_collapsed_v2',
    maximumLevel: 6,
    refreshInterval: 10 * 60 * 1000,
    retryInterval: 2 * 1000,
    islandDataUrl: '/data/islands.txt',
  });

  const ISLAND_UTILITIES = Object.freeze({
    hostSelector: '[class*="farm_town_el_"]',
    buttonSelector: '[data-egeltools-island-utility]',
    maximumTradeAmount: 3000,
    minimumTradeAmount: 100,
  });

  const UNIT_QUEUE = Object.freeze({
    buttonId: 'wachtrijMainButton',
    containerId: 'ui_box',
    administratorButtonIds: ['egeltools-unit-queue-button', 'wachtrijButton'],
    refreshInterval: 5 * 60 * 1000,
  });

  const CELEBRATION_COSTS = Object.freeze({
    party: Object.freeze({ wood: 15000, stone: 18000, iron: 15000 }),
    theater: Object.freeze({ wood: 10000, stone: 12000, iron: 10000 }),
  });

  const CELEBRATION_LABELS = Object.freeze({
    party: Object.freeze({ button: 'City party', action: 'city party', bulk: 'All CF', plural: 'city parties' }),
    theater: Object.freeze({ button: 'Theater', action: 'theater performance', bulk: 'All Theater', plural: 'theater performances' }),
    games: Object.freeze({ button: 'Olympics', action: 'Olympic Games', bulk: 'All Olympics', plural: 'Olympic Games' }),
  });

  let collectAlarmController = null;

  function getAttackAlarmSoundUrl() {
    return (localStorage.getItem(ATTACK_ALARM.soundKey) || '').trim();
  }

  function getYouTubeVideoId(value) {
    const candidate = String(value || '').trim();
    if (!candidate) return null;

    let url;
    try {
      url = new URL(candidate);
    } catch (error) {
      return null;
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    let videoId = '';
    if (hostname === 'youtu.be') {
      [videoId] = url.pathname.split('/').filter(Boolean);
    } else if (
      hostname === 'youtube.com'
      || hostname.endsWith('.youtube.com')
      || hostname === 'youtube-nocookie.com'
      || hostname.endsWith('.youtube-nocookie.com')
    ) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live'].includes(parts[0])) videoId = parts[1] || '';
      }
    }

    return /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : null;
  }

  function getAttackAlarmSoundSource(value = getAttackAlarmSoundUrl()) {
    const url = String(value || '').trim();
    if (!url) return { type: 'default', url: ATTACK_ALARM.defaultSoundUrl };

    const videoId = getYouTubeVideoId(url);
    return videoId
      ? { type: 'youtube', url, videoId }
      : { type: 'invalid', url };
  }

  function makeYouTubeEmbedUrl(videoId, loop) {
    const params = new URLSearchParams({
      autoplay: '1',
      controls: '0',
      disablekb: '1',
      playsinline: '1',
      rel: '0',
    });
    if (loop) {
      params.set('loop', '1');
      params.set('playlist', videoId);
    }
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  }

  function getStoredBoolean(key, defaultValue) {
    const stored = localStorage.getItem(key);
    return stored === null ? defaultValue : stored === 'on';
  }

  function normalizeClockTime(value, fallback) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value || '') ? value : fallback;
  }

  function normalizePlayerName(value) {
    let name = String(value || '');
    if (/%[0-9a-f]{2}/i.test(name)) {
      try {
        name = decodeURIComponent(name);
      } catch (error) { /* Keep the original text when it is not valid URL encoding. */ }
    }
    if (/[<&]/.test(name)) {
      name = new DOMParser().parseFromString(name, 'text/html').body.textContent || name;
    }
    return name
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/gu, ' ')
      .trim()
      .toLocaleLowerCase();
  }

  function getAttackAlarmSettings() {
    const minimumPoints = Number.parseInt(localStorage.getItem(ATTACK_ALARM.minimumPointsKey) || '0', 10);
    return {
      enabled: getStoredBoolean(ATTACK_ALARM.enabledKey, true),
      mutedPlayers: (localStorage.getItem(ATTACK_ALARM.mutedPlayersKey) || '')
        .split(/[\r\n,;]+/)
        .map(normalizePlayerName)
        .filter(Boolean),
      minimumPoints: Number.isFinite(minimumPoints) ? Math.max(0, minimumPoints) : 0,
      delayEnabled: getStoredBoolean(ATTACK_ALARM.delayEnabledKey, false),
      delayStart: normalizeClockTime(localStorage.getItem(ATTACK_ALARM.delayStartKey), '22:00'),
      delayEnd: normalizeClockTime(localStorage.getItem(ATTACK_ALARM.delayEndKey), '08:00'),
    };
  }

  function isTimeInDelayWindow(date, start, end) {
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return (hours * 60) + minutes;
    };
    const current = (date.getHours() * 60) + date.getMinutes();
    const from = toMinutes(start);
    const until = toMinutes(end);
    if (from === until) return true;
    return from < until
      ? current >= from && current < until
      : current >= from || current < until;
  }

  const hedgehogSvg = ({ className = '', title = '' } = {}) => `
    <svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
      aria-hidden="${title ? 'false' : 'true'}"${title ? ' role="img"' : ''}>
      ${title ? `<title>${title}</title>` : ''}
      <g stroke="#071a38" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path fill="#1676d2" d="M6 43c0-8.2 5.3-15.4 13.7-19.4l-7.2-5.8 11.1.5-1.2-9.5 8.5 7.5L36.7 6l4 11.1 10.6-6.5-3 13.2c6.4 3.2 10.2 8.4 10.2 14.3 0 11.1-12.1 18.1-29.8 18.1H18C10.6 56.2 6 51.2 6 43Z"/>
        <path fill="#f2bd73" d="M34.1 53.8c-1.7-10.6 2-20 11-25.4 4.6-2.7 10.3-.8 12.4 4l2.2 5.1-5.4 2.6c-.7 7-7.4 12.1-20.2 13.7Z"/>
        <path fill="#f2bd73" d="m41.8 23.5 4.8-4.6 3.1 7.1Z"/>
        <ellipse cx="50.4" cy="29.4" rx="3.5" ry="5.2" fill="#fff"/>
        <ellipse cx="51.5" cy="30.4" rx="1.25" ry="2.35" fill="#071a38" stroke="none"/>
        <circle cx="59.2" cy="37.4" r="3.1" fill="#071a38" stroke="none"/>
        <path d="M13.5 37.5c4.2-4.4 9.8-7.4 16.1-8.6M15.7 44.7c3.7-3.3 8.1-5.5 13-6.7" fill="none" stroke="#54b9ff" stroke-width="2"/>
        <path d="M17.8 55.7v2.1h8.6M39.5 55.2v2.6h8.1" fill="none"/>
      </g>
    </svg>`;

  function addStyles() {
    if (document.getElementById(APP.styleId)) return;

    const style = document.createElement('style');
    style.id = APP.styleId;
    style.textContent = `
      #${APP.windowId}[hidden] { display: none !important; }

      #${APP.windowId} {
        position: fixed;
        top: 50%;
        left: 50%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        width: min(430px, calc(100vw - 24px));
        height: auto !important;
        max-height: calc(100vh - 24px) !important;
        transform: translate(-50%, -50%);
        z-index: 2147483647;
        margin: 0;
        padding: 0 !important;
        overflow: hidden !important;
        border: 2px solid #4c351c !important;
        border-radius: 5px !important;
        color: #2c1c0e !important;
        background: #d6bd82 !important;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .55), inset 0 0 0 1px #f3dda4 !important;
        font: 12px Arial, Helvetica, sans-serif !important;
      }

      #${APP.windowId}:focus {
        outline: none !important;
      }

      #${APP.windowId} > .ui-dialog-titlebar {
        box-sizing: border-box;
        position: relative !important;
        inset: auto !important;
        display: flex !important;
        flex: 0 0 36px;
        align-self: stretch;
        align-items: center;
        width: auto !important;
        max-width: none !important;
        height: 36px !important;
        min-height: 36px;
        padding: 0 5px 0 7px !important;
        border: 0 !important;
        border-radius: 0 !important;
        color: #f3d58d !important;
        background: linear-gradient(#61492e, #382718) !important;
        box-shadow: inset 0 -1px #8d6e3f, inset 0 1px rgba(255, 255, 255, .08) !important;
        cursor: move;
        touch-action: none;
        user-select: none;
      }

      #${APP.windowId} > .ui-dialog-titlebar .ui-dialog-title {
        position: static !important;
        flex: 1 1 auto;
        width: auto !important;
        min-width: 0;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        overflow: hidden;
        color: #f3d58d !important;
        font: 12px Arial, Helvetica, sans-serif !important;
        line-height: 1 !important;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 1px #000;
      }

      #${APP.windowId} .egeltools-settings__logo {
        display: block;
        flex: 0 0 24px;
        width: 24px;
        height: 24px;
        margin-right: 6px;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .55));
      }

      #${APP.windowId} .egeltools-settings__brand-name {
        display: inline-block;
        color: #f6dc9a;
        font-size: 13px;
        font-weight: bold;
      }

      #${APP.windowId} .egeltools-settings__brand-context {
        display: inline-block;
        margin-left: 6px;
        padding-left: 6px;
        border-left: 1px solid rgba(216, 191, 130, .45);
        color: #d8bf82;
        font-size: 10px;
      }

      #${APP.windowId} .egeltools-settings__version {
        position: static !important;
        flex: 0 0 auto;
        min-width: 0;
        margin: 0 5px 0 8px;
        padding: 1px 6px;
        float: none !important;
        border: 1px solid rgba(185, 155, 88, .48);
        border-radius: 9px;
        color: #ead59f;
        background: rgba(20, 12, 6, .2);
        font: bold 9px/14px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #000;
      }

      #${APP.windowId} .egeltools-window__close {
        position: static !important;
        display: block !important;
        flex: 0 0 28px;
        width: 28px !important;
        height: 28px !important;
        min-width: 28px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 1px solid transparent !important;
        border-radius: 3px !important;
        color: #f3d58d !important;
        background: transparent !important;
        box-shadow: none !important;
        font: bold 19px/25px Arial, sans-serif !important;
        text-align: center;
        text-shadow: 0 1px #000;
        cursor: pointer;
      }

      #${APP.windowId} .egeltools-window__close:hover {
        color: #fff4cd !important;
        border-color: rgba(185, 155, 88, .65) !important;
        background: rgba(255, 255, 255, .11) !important;
      }

      #${APP.windowId} .egeltools-window__close:focus-visible {
        outline: 2px solid #f4d58c;
        outline-offset: -2px;
      }

      #${APP.windowId} .egeltools-settings__body {
        box-sizing: border-box;
        position: static !important;
        flex: 0 1 auto;
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: calc(100vh - 58px) !important;
        display: grid;
        align-content: start;
        gap: 4px;
        padding: 5px;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__feature {
        display: block;
        padding: 7px 9px;
        border: 1px solid rgba(92, 65, 29, .38);
        border-radius: 3px;
        background: rgba(255, 250, 226, .78);
        box-shadow: inset 0 1px rgba(255, 255, 255, .3);
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__feature-heading {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        justify-content: space-between;
      }

      #${APP.windowId} .egeltools-settings__feature--olympics {
        padding-top: 8px;
        padding-bottom: 8px;
      }

      #${APP.windowId} .egeltools-settings__feature-heading > div {
        min-width: 0;
      }

      #${APP.windowId} .egeltools-settings__option--inline {
        flex: 0 0 auto;
        margin-top: 0;
        padding: 3px 0;
        white-space: nowrap;
      }

      #${APP.windowId} .egeltools-settings__option--inline input {
        accent-color: #52772f;
      }

      #${APP.windowId} .egeltools-settings__option-note {
        color: #755a36;
        font-size: 9px;
        font-weight: normal;
      }

      #${APP.windowId} .egeltools-settings__feature-title {
        margin: 0 0 2px;
        font-weight: bold;
        font-size: 12px;
        line-height: 1.2;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__feature-copy {
        margin: 0;
        color: #5c482c;
        font-size: 10px;
        line-height: 1.25;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__option {
        display: flex;
        gap: 6px;
        align-items: center;
        margin-top: 6px;
        color: #49371f;
        font-size: 11px;
        cursor: pointer;
      }

      #${APP.windowId} .egeltools-settings__option input {
        margin: 0;
        accent-color: #52772f;
      }

      #${APP.windowId} .egeltools-settings__sound-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto auto;
        gap: 4px;
        margin-top: 7px;
      }

      #${APP.windowId} .egeltools-settings__sound-input {
        box-sizing: border-box;
        flex: 1 1 auto;
        min-width: 0;
        height: 25px;
        padding: 3px 6px;
        border: 1px solid #806238;
        border-radius: 3px;
        color: #2f2416;
        background: #fffbea;
        font: 11px Arial, Helvetica, sans-serif;
      }

      #${APP.windowId} .egeltools-settings__sound-input:focus {
        outline: 2px solid rgba(49, 87, 124, .55);
        outline-offset: 1px;
      }

      #${APP.windowId} .egeltools-settings__sound-button {
        flex: 0 0 auto;
        min-width: 44px;
        height: 25px;
        padding: 0 7px;
        border: 1px solid #49341c;
        border-radius: 3px;
        color: #fff3c5;
        background: linear-gradient(#587d35, #35551f);
        font: bold 11px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #1b260f;
        cursor: pointer;
      }

      #${APP.windowId} .egeltools-settings__sound-button--secondary {
        color: #49371f;
        background: linear-gradient(#ead49b, #caaa65);
        text-shadow: 0 1px rgba(255, 255, 255, .55);
      }

      #${APP.windowId} .egeltools-settings__sound-button:hover {
        filter: brightness(1.08);
      }

      #${APP.windowId} .egeltools-settings__sound-status {
        min-height: 11px;
        margin: 3px 0 0;
        color: #416321;
        font-size: 10px;
        line-height: 11px;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__sound-status[data-error='true'] {
        color: #9b2f24;
      }

      #${APP.windowId} .egeltools-settings__attack-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 122px;
        gap: 7px;
        margin-top: 7px;
      }

      #${APP.windowId} .egeltools-settings__field {
        display: flex;
        flex-direction: column;
        gap: 3px;
        color: #49371f;
        font-size: 10px;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__field-label {
        display: block;
        min-height: 12px;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__field input,
      #${APP.windowId} .egeltools-settings__field textarea {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid #806238;
        border-radius: 3px;
        color: #2f2416;
        background: #fffbea;
        font: 11px Arial, Helvetica, sans-serif;
      }

      #${APP.windowId} .egeltools-settings__field input {
        height: 26px;
        padding: 3px 6px;
      }

      #${APP.windowId} .egeltools-settings__field textarea {
        min-height: 42px;
        height: 42px;
        padding: 5px 6px;
        resize: vertical;
      }

      #${APP.windowId} .egeltools-settings__delay-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        align-items: center;
        margin-top: 6px;
        color: #49371f;
        font-size: 10px;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__delay-row input[type='time'] {
        box-sizing: border-box;
        width: 82px;
        height: 25px;
        border: 1px solid #806238;
        border-radius: 3px;
        background: #fffbea;
        font: 11px Arial, Helvetica, sans-serif;
      }

      #${APP.windowId} .egeltools-settings__delay-row label {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        margin: 0;
        text-align: left !important;
      }

      #${APP.windowId} .egeltools-settings__delay-row input[type='time']:disabled {
        color: #796b58;
        background: #e5dcc7;
        opacity: .8;
      }

      @media (max-width: 430px) {
        #${APP.windowId} .egeltools-settings__feature-heading {
          align-items: stretch;
          flex-direction: column;
          gap: 3px;
        }

        #${APP.windowId} .egeltools-settings__option--inline {
          align-self: flex-start;
          padding: 0;
        }

        #${APP.windowId} .egeltools-settings__sound-row {
          grid-template-columns: repeat(3, 1fr);
        }

        #${APP.windowId} .egeltools-settings__sound-input {
          grid-column: 1 / -1;
        }

        #${APP.windowId} .egeltools-settings__attack-grid {
          grid-template-columns: 1fr;
        }
      }

      a.button${ISLAND_UTILITIES.buttonSelector}.disabled .middle {
        background-position: -14px -184px;
      }

      a.button${ISLAND_UTILITIES.buttonSelector}.disabled .left {
        background-position: left -115px;
      }

      a.button${ISLAND_UTILITIES.buttonSelector}.disabled .right {
        background-position: right -46px;
      }

      a.button${ISLAND_UTILITIES.buttonSelector}.disabled {
        cursor: default;
        pointer-events: none;
      }

      #${ATTACK_ALARM.stopButtonId} {
        position: fixed;
        left: 15px;
        bottom: 82px;
        z-index: 2147483646;
        padding: 7px 10px;
        border: 2px solid #4c241b;
        border-radius: 4px;
        color: #fff4cf;
        background: linear-gradient(#ae4938, #70271e);
        box-shadow: 0 2px 5px rgba(0, 0, 0, .5);
        font: bold 11px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #30100c;
        cursor: pointer;
      }

      .egeltools-alarm-youtube-player {
        position: fixed !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 1px !important;
        height: 1px !important;
        border: 0 !important;
        opacity: .01 !important;
        pointer-events: none !important;
      }

      #${CELEBRATION_FINDER.refreshButtonId},
      #${CELEBRATION_FINDER.closeButtonId} {
        cursor: pointer;
      }

      #${CELEBRATION_FINDER.floatingButtonId} {
        display: block !important;
        position: fixed !important;
        right: min(220px, calc(100vw - 124px)) !important;
        bottom: 20px !important;
        z-index: 2147483646 !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-width: 104px;
        padding: 9px 14px;
        border: 2px solid #3f2d18;
        border-radius: 18px;
        color: #fff3c5;
        background: linear-gradient(#4f7e2d, #31551c);
        box-shadow: inset 0 1px rgba(255, 255, 255, .25), 0 2px 5px rgba(0, 0, 0, .5);
        font: bold 12px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #1b260f;
        cursor: pointer;
      }

      #${CELEBRATION_FINDER.floatingButtonId}:hover {
        background: linear-gradient(#629839, #3c6622);
      }

      #${CELEBRATION_FINDER.floatingButtonId}[aria-expanded='true'] {
        background: linear-gradient(#a9513d, #743326);
      }

      #${CELEBRATION_FINDER.floatingButtonId}:focus-visible {
        outline: 2px solid #f4d58c;
        outline-offset: 2px;
      }

      #${CELEBRATION_FINDER.panelId}[hidden] { display: none !important; }

      #${CELEBRATION_FINDER.panelId} {
        position: fixed;
        right: 20px;
        bottom: 72px;
        width: min(370px, calc(100vw - 32px));
        z-index: 2147483645;
        overflow: hidden;
        border: 2px solid #4c351c;
        border-radius: 5px;
        color: #2c1c0e;
        background: #d6bd82;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .55), inset 0 0 0 1px #f3dda4;
        font: 12px Arial, Helvetica, sans-serif;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__header {
        display: flex;
        align-items: center;
        min-height: 34px;
        padding: 0 6px 0 11px;
        color: #f3d58d;
        background: linear-gradient(#57432b, #332416);
        cursor: move;
        touch-action: none;
        user-select: none;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        font-weight: bold;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 1px #000;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__header button {
        width: 26px;
        height: 26px;
        padding: 0;
        border: 0;
        color: #f3d58d;
        background: transparent;
        font: bold 17px/26px Arial, sans-serif;
        text-shadow: 0 1px #000;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__header button:hover {
        color: #fff4cd;
        background: rgba(255, 255, 255, .1);
      }

      #${CELEBRATION_FINDER.bulkActionsId} {
        display: flex;
        flex: 0 0 auto;
        gap: 3px;
        margin-right: 3px;
      }

      #${CELEBRATION_FINDER.bulkActionsId} .egeltools-celebration__bulk-button {
        width: auto !important;
        height: 22px !important;
        padding: 0 7px !important;
        border: 1px solid #b99b58 !important;
        border-radius: 10px;
        color: #fff4cd !important;
        background: linear-gradient(#5f8c35, #355a20) !important;
        font: bold 10px/20px Arial, Helvetica, sans-serif !important;
        white-space: nowrap;
      }

      #${CELEBRATION_FINDER.bulkActionsId} .egeltools-celebration__bulk-button:hover:not(:disabled) {
        background: linear-gradient(#73a643, #416b28) !important;
      }

      #${CELEBRATION_FINDER.bulkActionsId} .egeltools-celebration__bulk-button:disabled {
        color: #b8aa8b !important;
        background: #554b3c !important;
        cursor: not-allowed;
        opacity: .78;
      }

      #${CELEBRATION_FINDER.bodyId} {
        box-sizing: border-box;
        max-height: min(380px, calc(100vh - 90px));
        padding: 4px;
        overflow: auto;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__town {
        display: flex !important;
        flex-flow: row nowrap !important;
        justify-content: space-between;
        gap: 5px;
        align-items: center;
        min-height: 22px;
        padding: 2px 5px;
        border-bottom: 1px solid rgba(92, 65, 29, .28);
        background: rgba(255, 250, 226, .78);
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__town:first-child {
        border-radius: 3px 3px 0 0;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__town:last-child {
        border-bottom: 0;
        border-radius: 0 0 3px 3px;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__town-link {
        position: static !important;
        display: block !important;
        flex: 1 1 auto;
        width: auto !important;
        min-width: 0;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        clear: none !important;
        overflow: hidden;
        color: #214f82;
        font-weight: bold;
        line-height: 18px;
        text-align: left !important;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__actions {
        position: static !important;
        display: flex !important;
        flex: 0 0 auto;
        flex-flow: row nowrap !important;
        gap: 3px;
        width: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        clear: none !important;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__badge {
        position: static !important;
        display: inline-block !important;
        flex: 0 0 auto;
        width: auto !important;
        min-width: 0;
        min-height: 0;
        margin: 0 !important;
        padding: 1px 5px;
        float: none !important;
        clear: none !important;
        border: 1px solid #806232;
        border-radius: 10px;
        color: #4a3214;
        background: #e6c976;
        font: bold 10px/15px Arial, Helvetica, sans-serif;
        white-space: nowrap;
        text-shadow: none;
        cursor: pointer;
        appearance: none;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__badge--theater {
        background: #bdcfdf;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__badge--games {
        background: #e6bc58;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__badge:hover:not(:disabled) {
        filter: brightness(1.08);
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__badge:disabled {
        color: #756a58;
        background: #c8c0ac;
        cursor: not-allowed;
        opacity: .72;
      }

      #${CELEBRATION_FINDER.panelId} .egeltools-celebration__state {
        margin: 0;
        padding: 18px 12px;
        border-radius: 3px;
        text-align: center;
        background: rgba(255, 250, 226, .78);
      }

      #${TOWN_DISTANCE_SORTER.floatingButtonId} {
        display: block !important;
        position: fixed !important;
        right: min(220px, calc(100vw - 124px)) !important;
        bottom: 62px !important;
        z-index: 2147483646 !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-width: 104px;
        padding: 7px 12px;
        border: 2px solid #3f2d18;
        border-radius: 16px;
        color: #fff3c5;
        background: linear-gradient(#466f91, #294c6b);
        box-shadow: inset 0 1px rgba(255, 255, 255, .25), 0 2px 5px rgba(0, 0, 0, .5);
        font: bold 11px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #162b3c;
        cursor: pointer;
      }

      #${TOWN_DISTANCE_SORTER.floatingButtonId}:hover {
        background: linear-gradient(#5685ac, #315b80);
      }

      #${TOWN_DISTANCE_SORTER.floatingButtonId}[aria-expanded='true'] {
        background: linear-gradient(#a9513d, #743326);
      }

      #${TOWN_DISTANCE_SORTER.floatingButtonId}:focus-visible {
        outline: 2px solid #f4d58c;
        outline-offset: 2px;
      }

      #${TOWN_DISTANCE_SORTER.panelId}[hidden] { display: none !important; }

      #${TOWN_DISTANCE_SORTER.panelId} {
        position: fixed;
        right: 20px;
        bottom: 112px;
        width: min(390px, calc(100vw - 32px));
        z-index: 2147483645;
        overflow: hidden;
        border: 2px solid #4c351c;
        border-radius: 5px;
        color: #2c1c0e;
        background: #d6bd82;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .55), inset 0 0 0 1px #f3dda4;
        font: 12px Arial, Helvetica, sans-serif;
      }

      #${TOWN_DISTANCE_SORTER.panelId} .egeltools-town-distance__header {
        display: flex;
        align-items: center;
        min-height: 34px;
        padding: 0 6px 0 11px;
        color: #f3d58d;
        background: linear-gradient(#57432b, #332416);
        cursor: move;
        touch-action: none;
        user-select: none;
      }

      #${TOWN_DISTANCE_SORTER.panelId} .egeltools-town-distance__title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        font-weight: bold;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 1px #000;
      }

      #${TOWN_DISTANCE_SORTER.panelId} .egeltools-town-distance__header button {
        width: 26px;
        height: 26px;
        padding: 0;
        border: 0;
        color: #f3d58d;
        background: transparent;
        font: bold 17px/26px Arial, sans-serif;
        text-shadow: 0 1px #000;
        cursor: pointer;
      }

      #${TOWN_DISTANCE_SORTER.panelId} .egeltools-town-distance__header button:hover {
        color: #fff4cd;
        background: rgba(255, 255, 255, .1);
      }

      #${TOWN_DISTANCE_SORTER.bodyId} {
        box-sizing: border-box;
        max-height: min(430px, calc(100vh - 150px));
        padding: 4px;
        overflow: auto;
      }

      #${TOWN_DISTANCE_SORTER.panelId} .egeltools-town-distance__table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      #${TOWN_DISTANCE_SORTER.panelId} th {
        padding: 5px;
        color: #fff3c5;
        background: #71522e;
        font-size: 11px;
        text-align: left;
      }

      #${TOWN_DISTANCE_SORTER.panelId} th:nth-child(1) { width: 43%; }
      #${TOWN_DISTANCE_SORTER.panelId} th:nth-child(2) { width: 24%; }
      #${TOWN_DISTANCE_SORTER.panelId} th:nth-child(3) { width: 33%; }

      #${TOWN_DISTANCE_SORTER.panelId} tbody tr {
        border-bottom: 1px solid rgba(92, 65, 29, .25);
        background: rgba(255, 250, 226, .78);
        cursor: pointer;
      }

      #${TOWN_DISTANCE_SORTER.panelId} tbody tr:nth-child(even) {
        background: rgba(233, 218, 180, .92);
      }

      #${TOWN_DISTANCE_SORTER.panelId} tbody tr:hover {
        background: #e7ca7d;
      }

      #${TOWN_DISTANCE_SORTER.panelId} tbody tr[aria-current='true'] {
        background: #b7995d;
        font-weight: bold;
      }

      #${TOWN_DISTANCE_SORTER.panelId} td {
        padding: 5px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${TOWN_DISTANCE_SORTER.panelId} .egeltools-town-distance__state {
        margin: 0;
        padding: 18px 12px;
        border-radius: 3px;
        text-align: center;
        background: rgba(255, 250, 226, .78);
      }

      #${RESOURCE_CHECKER.floatingButtonId} {
        display: block !important;
        position: fixed !important;
        right: min(220px, calc(100vw - 124px)) !important;
        bottom: 101px !important;
        z-index: 2147483646 !important;
        visibility: visible !important;
        opacity: 1 !important;
        min-width: 104px;
        padding: 7px 12px;
        border: 2px solid #3f2d18;
        border-radius: 16px;
        color: #fff3c5;
        background: linear-gradient(#8b6733, #5c3d1f);
        box-shadow: inset 0 1px rgba(255, 255, 255, .25), 0 2px 5px rgba(0, 0, 0, .5);
        font: bold 11px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #2c1b0d;
        cursor: pointer;
      }

      #${RESOURCE_CHECKER.floatingButtonId}:hover {
        background: linear-gradient(#a47b3e, #6d4a26);
      }

      #${RESOURCE_CHECKER.floatingButtonId}[aria-expanded='true'] {
        background: linear-gradient(#a9513d, #743326);
      }

      #${RESOURCE_CHECKER.floatingButtonId}:focus-visible {
        outline: 2px solid #f4d58c;
        outline-offset: 2px;
      }

      #${APP.toolDockId} {
        display: flex !important;
        position: fixed !important;
        right: min(220px, max(10px, calc(100vw - 420px))) !important;
        bottom: 20px !important;
        z-index: 2147483646 !important;
        box-sizing: border-box;
        align-items: stretch;
        gap: 5px;
        max-width: calc(100vw - 20px);
        padding: 5px;
        border: 2px solid #493218;
        border-radius: 8px;
        visibility: visible !important;
        opacity: 1 !important;
        background: linear-gradient(#dac48c, #ae8c50);
        box-shadow: inset 0 1px rgba(255, 255, 255, .45), 0 3px 8px rgba(0, 0, 0, .5);
        font-family: Arial, Helvetica, sans-serif;
      }

      #${APP.toolDockId} .egeltools-tool-dock__brand {
        appearance: none;
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 5px;
        min-width: 0;
        padding: 4px 8px 4px 5px;
        border: 1px solid #173b59;
        border-radius: 5px;
        color: #fff3c5;
        background: linear-gradient(#2d78ad, #174d78);
        box-shadow: inset 0 1px rgba(255, 255, 255, .25);
        font-size: 11px;
        font-weight: bold;
        text-shadow: 0 1px #102b42;
        white-space: nowrap;
        cursor: pointer;
      }

      #${APP.toolDockId} .egeltools-tool-dock__brand:hover {
        background: linear-gradient(#398bc3, #1d5d8d);
      }

      #${APP.toolDockId} .egeltools-tool-dock__brand[aria-expanded='true'] {
        border-color: #6f271f;
        background: linear-gradient(#a9513d, #743326);
        text-shadow: 0 1px #30100c;
      }

      #${APP.toolDockId} .egeltools-tool-dock__brand:focus-visible {
        outline: 2px solid #f4d58c;
        outline-offset: 2px;
      }

      #${APP.toolDockId} .egeltools-tool-dock__logo {
        width: 23px;
        height: 23px;
        filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .45));
      }

      #${APP.toolDockActionsId} {
        display: flex;
        min-width: 0;
        gap: 4px;
      }

      #${APP.toolDockId} #${CELEBRATION_FINDER.floatingButtonId},
      #${APP.toolDockId} #${TOWN_DISTANCE_SORTER.floatingButtonId},
      #${APP.toolDockId} #${RESOURCE_CHECKER.floatingButtonId} {
        display: inline-flex !important;
        position: static !important;
        right: auto !important;
        bottom: auto !important;
        z-index: auto !important;
        box-sizing: border-box;
        flex: 0 1 auto;
        align-items: center;
        justify-content: center;
        min-width: 0;
        margin: 0;
        padding: 7px 9px;
        border-width: 1px;
        border-radius: 5px;
        font-size: 11px;
        line-height: 1.15;
        white-space: nowrap;
      }

      @media (max-width: 520px) {
        #${APP.toolDockId} {
          right: 8px !important;
          gap: 3px;
          max-width: calc(100vw - 16px);
          padding: 4px;
        }

        #${APP.toolDockId} .egeltools-tool-dock__brand {
          padding-right: 5px;
        }

        #${APP.toolDockId} .egeltools-tool-dock__brand-label {
          display: none;
        }

        #${APP.toolDockActionsId} { gap: 3px; }

        #${APP.toolDockId} #${CELEBRATION_FINDER.floatingButtonId},
        #${APP.toolDockId} #${TOWN_DISTANCE_SORTER.floatingButtonId},
        #${APP.toolDockId} #${RESOURCE_CHECKER.floatingButtonId} {
          padding: 7px 6px;
          overflow: hidden;
          font-size: 10px;
          text-overflow: ellipsis;
        }
      }

      #${RESOURCE_CHECKER.panelId}[hidden] { display: none !important; }

      #${RESOURCE_CHECKER.panelId} {
        position: fixed;
        right: 20px;
        bottom: 150px;
        width: min(470px, calc(100vw - 24px));
        z-index: 2147483645;
        overflow: hidden;
        border: 2px solid #4c351c;
        border-radius: 5px;
        color: #2c1c0e;
        background: #d6bd82;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .55), inset 0 0 0 1px #f3dda4;
        font: 12px Arial, Helvetica, sans-serif;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__header {
        display: flex;
        align-items: center;
        min-height: 34px;
        padding: 0 6px 0 11px;
        color: #f3d58d;
        background: linear-gradient(#57432b, #332416);
        cursor: move;
        touch-action: none;
        user-select: none;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__title {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        font-weight: bold;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-shadow: 0 1px #000;
      }

      #${RESOURCE_CHECKER.countId} {
        margin-right: 5px;
        padding: 1px 7px;
        border: 1px solid #b99b58;
        border-radius: 10px;
        color: #fff4cd;
        background: #8c3e2f;
        font: bold 10px/17px Arial, Helvetica, sans-serif;
        text-shadow: none;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__header button {
        width: 26px;
        height: 26px;
        padding: 0;
        border: 0;
        color: #f3d58d;
        background: transparent;
        font: bold 17px/26px Arial, sans-serif;
        text-shadow: 0 1px #000;
        cursor: pointer;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__header button:hover {
        color: #fff4cd;
        background: rgba(255, 255, 255, .1);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__thresholds {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
        gap: 3px;
        align-items: center;
        padding: 5px;
        border-bottom: 1px solid rgba(92, 65, 29, .35);
        background: #c7aa6b;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__threshold {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        gap: 3px;
        align-items: center;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__threshold input {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        height: 23px;
        padding: 2px 4px;
        border: 1px solid #806238;
        border-radius: 3px;
        color: #2f2416;
        background: #fffbea;
        font: 11px Arial, Helvetica, sans-serif;
      }

      #${RESOURCE_CHECKER.applyButtonId} {
        height: 23px;
        padding: 0 7px;
        border: 1px solid #49341c;
        border-radius: 3px;
        color: #fff3c5;
        background: linear-gradient(#587d35, #35551f);
        font: bold 10px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #1b260f;
        cursor: pointer;
      }

      #${RESOURCE_CHECKER.applyButtonId}:hover {
        background: linear-gradient(#6c9641, #416827);
      }

      #${RESOURCE_CHECKER.sorterId} {
        display: flex;
        gap: 3px;
        align-items: center;
        padding: 3px 5px;
        border-bottom: 1px solid rgba(92, 65, 29, .28);
        color: #5c482c;
        background: rgba(255, 248, 218, .62);
        font-size: 9px;
      }

      #${RESOURCE_CHECKER.sorterId} .egeltools-resource-checker__sort-button {
        display: inline-flex;
        gap: 2px;
        align-items: center;
        min-height: 20px;
        padding: 0 6px;
        border: 1px solid #806238;
        border-radius: 11px;
        color: #49371f;
        background: linear-gradient(#ead49b, #caaa65);
        font: bold 9px/18px Arial, Helvetica, sans-serif;
        cursor: pointer;
      }

      #${RESOURCE_CHECKER.sorterId} .egeltools-resource-checker__sort-button[aria-pressed='true'] {
        color: #fff4cd;
        background: linear-gradient(#5f8c35, #355a20);
        text-shadow: 0 1px #1b260f;
      }

      #${RESOURCE_CHECKER.sorterId} .egeltools-resource-checker__sort-button:hover {
        filter: brightness(1.08);
      }

      #${RESOURCE_CHECKER.bodyId} {
        box-sizing: border-box;
        max-height: min(470px, calc(100vh - 200px));
        padding: 2px;
        overflow: auto;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town {
        border-bottom: 1px solid rgba(92, 65, 29, .28);
        background: rgba(255, 250, 226, .82);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town:nth-child(even) {
        background: rgba(233, 218, 180, .94);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town:last-child {
        border-bottom: 0;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town-summary {
        display: flex;
        gap: 3px;
        align-items: center;
        min-height: 26px;
        padding: 2px 4px;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__party-lock {
        display: inline-flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        width: 19px;
        height: 19px;
        padding: 0;
        border: 1px solid #6f271f;
        border-radius: 4px;
        color: #fff4cf;
        background: linear-gradient(#a9513d, #743326);
        font: 11px/17px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #30100c;
        white-space: nowrap;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__lock-detail {
        display: flex;
        flex-wrap: wrap;
        gap: 2px 5px;
        align-items: center;
        margin: 0 4px 3px;
        padding: 2px 4px;
        border: 0;
        border-left: 2px solid rgba(111, 39, 31, .72);
        border-radius: 3px;
        color: #6f271f;
        background: rgba(169, 81, 61, .1);
        font-size: 9px;
        line-height: 12px;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__lock-detail strong {
        font-size: 9px;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__lock-detail .egeltools-resource-checker__resource {
        min-width: 0;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town-link,
      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor-link {
        position: static !important;
        display: block !important;
        width: auto !important;
        min-width: 0;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        clear: none !important;
        overflow: hidden;
        color: #214f82;
        font-weight: bold;
        text-align: left !important;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town-link {
        flex: 1 1 130px;
        line-height: 20px;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__deficits,
      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor-resources,
      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__remaining-resources {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        gap: 3px 7px;
        align-items: center;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__resource {
        display: inline-flex;
        gap: 2px;
        align-items: center;
        min-width: 58px;
        color: #49371f;
        font: bold 10px Arial, Helvetica, sans-serif;
        white-space: nowrap;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__resource small {
        color: #9b2f24;
        font-size: 9px;
        font-weight: normal;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__icon-frame {
        position: static !important;
        display: inline-flex !important;
        flex: 0 0 28px;
        width: 28px !important;
        min-width: 28px !important;
        height: 24px !important;
        align-items: center;
        justify-content: center;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        vertical-align: middle;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__icon.resources_small {
        position: static !important;
        display: inline-block !important;
        flex: 0 0 auto;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        overflow: visible !important;
        vertical-align: middle;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__find-button {
        flex: 0 0 auto;
        min-width: 54px;
        min-height: 20px;
        padding: 1px 6px;
        border: 1px solid #806232;
        border-radius: 11px;
        color: #4a3214;
        background: linear-gradient(#ead49b, #caaa65);
        font: bold 9px/17px Arial, Helvetica, sans-serif;
        cursor: pointer;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__find-button:hover,
      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__find-button[aria-expanded='true'] {
        color: #fff4cd;
        background: linear-gradient(#5f8c35, #355a20);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donors[hidden] {
        display: none !important;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donors {
        margin: 0 4px 3px;
        overflow: hidden;
        border: 1px solid #8d6e3f;
        border-radius: 3px;
        background: rgba(255, 248, 218, .72);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor {
        display: grid;
        grid-template-columns: minmax(88px, 1fr) auto auto auto;
        gap: 3px;
        align-items: center;
        min-height: 23px;
        padding: 1px 4px;
        border-bottom: 1px solid rgba(92, 65, 29, .2);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor:last-child {
        border-bottom: 0;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor-link {
        font-size: 10px;
        line-height: 18px;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor-distance {
        color: #6a5639;
        font-size: 9px;
        white-space: nowrap;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__trade-button {
        min-width: 48px;
        height: 20px;
        padding: 0 6px;
        border: 1px solid #49341c;
        border-radius: 3px;
        color: #fff3c5;
        background: linear-gradient(#587d35, #35551f);
        font: bold 9px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #1b260f;
        cursor: pointer;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__trade-button:hover:not(:disabled) {
        background: linear-gradient(#6c9641, #416827);
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__trade-button:disabled {
        color: #8a806e;
        background: #c8c0ac;
        text-shadow: none;
        cursor: not-allowed;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor-note,
      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__state {
        margin: 0;
        padding: 9px;
        color: #5c482c;
        font-size: 10px;
        text-align: center;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__state {
        padding: 18px 12px;
        border-radius: 3px;
        background: rgba(255, 250, 226, .78);
        font-size: 12px;
      }

      #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__remaining {
        display: flex;
        gap: 5px;
        align-items: center;
        padding: 3px 4px;
        color: #8b2f24;
        background: rgba(155, 47, 36, .09);
        font-size: 9px;
      }

      @media (max-width: 520px) {
        #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__thresholds {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        #${RESOURCE_CHECKER.applyButtonId} { grid-column: 1 / -1; }

        #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town-summary {
          flex-wrap: wrap;
        }

        #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__town-link {
          flex-basis: calc(100% - 150px);
        }

        #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__deficits {
          order: 3;
          width: 100%;
        }

        #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor {
          grid-template-columns: minmax(82px, 1fr) auto auto;
        }

        #${RESOURCE_CHECKER.panelId} .egeltools-resource-checker__donor-distance {
          display: none;
        }
      }

      #${BD_LEVEL_CHECK.panelId} {
        position: absolute;
        top: 38px;
        z-index: 10002;
        display: flex;
        align-items: flex-start;
        color: #2c1c0e;
        font: 12px Arial, Helvetica, sans-serif;
      }

      #${BD_LEVEL_CHECK.panelId}[data-side='right'] {
        left: calc(100% + 4px);
      }

      #${BD_LEVEL_CHECK.panelId}[data-side='left'] {
        right: calc(100% + 4px);
        flex-direction: row-reverse;
      }

      #${BD_LEVEL_CHECK.toggleId} {
        box-sizing: border-box;
        width: 34px;
        min-height: 108px;
        padding: 8px 6px;
        border: 2px solid #4c351c;
        border-radius: 5px 0 0 5px;
        color: #f3d58d;
        background: linear-gradient(#57432b, #332416);
        box-shadow: 0 3px 9px rgba(0, 0, 0, .42);
        font: bold 11px/17px Arial, Helvetica, sans-serif;
        text-shadow: 0 1px #000;
        cursor: pointer;
        writing-mode: vertical-rl;
      }

      #${BD_LEVEL_CHECK.panelId}[data-side='left'] #${BD_LEVEL_CHECK.toggleId} {
        border-radius: 0 5px 5px 0;
      }

      #${BD_LEVEL_CHECK.toggleId}:hover,
      #${BD_LEVEL_CHECK.toggleId}:focus-visible {
        color: #fff4cd;
        background: linear-gradient(#6b5337, #3e2d1c);
      }

      #${BD_LEVEL_CHECK.countId} {
        display: inline-grid;
        place-items: center;
        min-width: 18px;
        min-height: 18px;
        margin-top: 5px;
        border-radius: 9px;
        color: #fff;
        background: #9b392c;
        font-size: 10px;
        writing-mode: horizontal-tb;
      }

      #${BD_LEVEL_CHECK.panelId} .egeltools-bd-level__window {
        box-sizing: border-box;
        width: 292px;
        overflow: hidden;
        border: 2px solid #4c351c;
        border-radius: 0 5px 5px 5px;
        background: #d6bd82;
        box-shadow: 0 5px 18px rgba(0, 0, 0, .55), inset 0 0 0 1px #f3dda4;
      }

      #${BD_LEVEL_CHECK.panelId}[data-side='left'] .egeltools-bd-level__window {
        border-radius: 5px 0 5px 5px;
      }

      #${BD_LEVEL_CHECK.panelId}[data-collapsed='true'] .egeltools-bd-level__window {
        display: none;
      }

      #${BD_LEVEL_CHECK.panelId} .egeltools-bd-level__header {
        display: flex;
        align-items: center;
        min-height: 32px;
        padding: 0 5px 0 10px;
        color: #f3d58d;
        background: linear-gradient(#57432b, #332416);
        text-shadow: 0 1px #000;
      }

      #${BD_LEVEL_CHECK.panelId} .egeltools-bd-level__title {
        flex: 1;
        font-weight: bold;
      }

      #${BD_LEVEL_CHECK.refreshId} {
        width: 25px;
        height: 25px;
        padding: 0;
        border: 0;
        color: #f3d58d;
        background: transparent;
        font: bold 17px/25px Arial, sans-serif;
        text-shadow: 0 1px #000;
        cursor: pointer;
      }

      #${BD_LEVEL_CHECK.refreshId}:hover {
        color: #fff4cd;
        background: rgba(255, 255, 255, .1);
      }

      #${BD_LEVEL_CHECK.bodyId} {
        box-sizing: border-box;
        max-height: min(430px, calc(100vh - 110px));
        padding: 4px;
        overflow-y: auto;
      }

      #${BD_LEVEL_CHECK.bodyId} .egeltools-bd-level__list {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      #${BD_LEVEL_CHECK.bodyId} .egeltools-bd-level__item {
        padding: 5px 7px;
        border-bottom: 1px solid rgba(92, 65, 29, .28);
        background: rgba(255, 250, 226, .78);
        line-height: 18px;
      }

      #${BD_LEVEL_CHECK.bodyId} .egeltools-bd-level__item:last-child {
        border-bottom: 0;
      }

      #${BD_LEVEL_CHECK.bodyId} .egeltools-bd-level__town-link {
        display: inline !important;
        width: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        float: none !important;
        color: #214f82;
        font-weight: bold;
        text-align: left !important;
      }

      #${BD_LEVEL_CHECK.bodyId} .egeltools-bd-level__state {
        margin: 0;
        padding: 16px 10px;
        border-radius: 3px;
        text-align: center;
        background: rgba(255, 250, 226, .78);
      }

      .egeltools-unit-queue {
        box-sizing: border-box;
        min-height: 100%;
        padding: 10px;
        color: #4b3218;
        font: 12px/1.25 Arial, Helvetica, sans-serif;
      }

      .egeltools-unit-queue__summary {
        margin: 0 0 10px;
        padding: 7px 9px;
        border: 1px solid rgba(91, 61, 25, .42);
        border-radius: 3px;
        background: rgba(255, 248, 218, .72);
        font-weight: bold;
        text-align: center;
      }

      .egeltools-unit-queue__section + .egeltools-unit-queue__section {
        margin-top: 12px;
      }

      .egeltools-unit-queue__heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0 0 5px;
        padding: 5px 8px;
        border: 1px solid #553a1b;
        border-radius: 3px;
        color: #f5d994;
        background: linear-gradient(#78552a, #4d3418);
        font-size: 13px;
        text-shadow: 0 1px #1d1208;
      }

      .egeltools-unit-queue__total {
        font-size: 11px;
        font-weight: normal;
      }

      .egeltools-unit-queue__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;
      }

      .egeltools-unit-queue__unit {
        display: flex;
        align-items: center;
        min-width: 0;
        min-height: 46px;
        padding: 3px 6px 3px 3px;
        border: 1px solid rgba(93, 64, 29, .35);
        border-radius: 3px;
        background: rgba(255, 250, 226, .82);
        box-shadow: inset 0 1px rgba(255, 255, 255, .55);
      }

      .egeltools-unit-queue__icon {
        flex: 0 0 40px;
        margin-right: 7px;
      }

      .egeltools-unit-queue__details {
        min-width: 0;
      }

      .egeltools-unit-queue__name {
        display: block;
        overflow: hidden;
        font-size: 11px;
        font-weight: bold;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .egeltools-unit-queue__count {
        display: block;
        margin-top: 2px;
        color: #214f82;
        font-size: 15px;
        font-weight: bold;
      }

      .egeltools-unit-queue__empty {
        grid-column: 1 / -1;
        margin: 0;
        padding: 10px;
        border: 1px dashed rgba(93, 64, 29, .32);
        border-radius: 3px;
        color: #755c3d;
        text-align: center;
        background: rgba(255, 250, 226, .5);
      }

      #${COLLECT_ALARM.fallbackStopButtonId} .boerendorpIcoon {
        display: block;
        width: 28px;
        height: 26px;
        background: url('https://gme.cyllos.dev/res/bdfarmed.png') 0 0 no-repeat !important;
      }

      #${COLLECT_ALARM.fallbackStopButtonId}:focus-visible {
        outline: 2px solid #f4d58c;
        outline-offset: 1px;
      }
    `;
    document.head.append(style);
  }

  function closeSettings() {
    const settingsWindow = document.getElementById(APP.windowId);
    const launcherButton = document.getElementById(APP.toolDockSettingsButtonId);

    if (!settingsWindow || settingsWindow.hidden) return;
    settingsWindow.hidden = true;
    collectAlarmController?.stopTest();
    const soundTestButton = settingsWindow.querySelector(`#${ATTACK_ALARM.soundTestButtonId}`);
    if (soundTestButton) {
      soundTestButton.textContent = 'Test';
      soundTestButton.setAttribute('aria-pressed', 'false');
    }
    launcherButton?.classList.remove('checked');
    launcherButton?.setAttribute('aria-expanded', 'false');
    launcherButton?.focus();
  }

  function makeDraggable(settingsWindow) {
    const handle = settingsWindow.querySelector('.ui-dialog-titlebar');
    let dragState = null;

    const stopDragging = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragState = null;
      window.removeEventListener('pointermove', moveWindow);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };

    const moveWindow = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      const maxLeft = Math.max(0, window.innerWidth - dragState.width);
      const maxTop = Math.max(0, window.innerHeight - dragState.height);
      const left = Math.min(maxLeft, Math.max(0, event.clientX - dragState.offsetX));
      const top = Math.min(maxTop, Math.max(0, event.clientY - dragState.offsetY));

      settingsWindow.style.left = `${left}px`;
      settingsWindow.style.top = `${top}px`;
    };

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button')) return;

      const bounds = settingsWindow.getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      };

      settingsWindow.style.transform = 'none';
      settingsWindow.style.left = `${bounds.left}px`;
      settingsWindow.style.top = `${bounds.top}px`;

      window.addEventListener('pointermove', moveWindow);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
      event.preventDefault();
    });
  }

  function keepSettingsWindowInViewport(settingsWindow) {
    if (!settingsWindow?.isConnected || settingsWindow.hidden) return;

    const margin = 8;
    const bounds = settingsWindow.getBoundingClientRect();
    if (
      bounds.left >= margin
      && bounds.top >= margin
      && bounds.right <= window.innerWidth - margin
      && bounds.bottom <= window.innerHeight - margin
    ) return;

    const maxLeft = Math.max(margin, window.innerWidth - bounds.width - margin);
    const maxTop = Math.max(margin, window.innerHeight - bounds.height - margin);
    settingsWindow.style.transform = 'none';
    settingsWindow.style.left = `${Math.min(maxLeft, Math.max(margin, bounds.left))}px`;
    settingsWindow.style.top = `${Math.min(maxTop, Math.max(margin, bounds.top))}px`;
  }

  function createSettingsWindow() {
    let settingsWindow = document.getElementById(APP.windowId);
    if (settingsWindow) return settingsWindow;

    settingsWindow = document.createElement('div');
    settingsWindow.id = APP.windowId;
    settingsWindow.className = 'ui-dialog ui-corner-all ui-widget ui-widget-content ui-front ui-draggable js-window-main-container';
    settingsWindow.tabIndex = -1;
    settingsWindow.setAttribute('role', 'dialog');
    settingsWindow.setAttribute('aria-modal', 'false');
    settingsWindow.setAttribute('aria-labelledby', 'egeltools-window-title');
    settingsWindow.hidden = true;
    settingsWindow.innerHTML = `
      <div class="ui-dialog-titlebar ui-draggable-handle">
        ${hedgehogSvg({ className: 'egeltools-settings__logo' })}
        <span class="ui-dialog-title" id="egeltools-window-title">
          <span class="egeltools-settings__brand-name">${APP.name}</span>
          <span class="egeltools-settings__brand-context">Settings</span>
        </span>
        <span class="egeltools-settings__version">v${APP.version}</span>
        <button class="egeltools-window__close" type="button" aria-label="Close settings">&times;</button>
      </div>
      <div class="egeltools-settings__body">
                <div class="egeltools-settings__feature egeltools-settings__feature--attack">
                  <div class="egeltools-settings__feature-heading">
                    <div>
                      <p class="egeltools-settings__feature-title">Incoming-attack alarm</p>
                      <p class="egeltools-settings__feature-copy">Choose which attacks should trigger an alert.</p>
                    </div>
                    <label class="egeltools-settings__option egeltools-settings__option--inline"
                      for="${ATTACK_ALARM.enabledInputId}">
                      <input id="${ATTACK_ALARM.enabledInputId}" type="checkbox">
                      Enabled
                    </label>
                  </div>
                  <div class="egeltools-settings__attack-grid">
                    <label class="egeltools-settings__field" for="${ATTACK_ALARM.mutedPlayersInputId}">
                      <span class="egeltools-settings__field-label">
                        Muted players <span class="egeltools-settings__option-note">· comma or new line separated</span>
                      </span>
                      <textarea id="${ATTACK_ALARM.mutedPlayersInputId}"
                        placeholder="Player one, Player two"></textarea>
                    </label>
                    <label class="egeltools-settings__field" for="${ATTACK_ALARM.minimumPointsInputId}">
                      <span class="egeltools-settings__field-label">Minimum player points</span>
                      <input id="${ATTACK_ALARM.minimumPointsInputId}" type="number"
                        inputmode="numeric" min="0" step="1000" placeholder="0">
                    </label>
                  </div>
                  <div class="egeltools-settings__delay-row">
                    <label for="${ATTACK_ALARM.delayEnabledInputId}">
                      <input id="${ATTACK_ALARM.delayEnabledInputId}" type="checkbox">
                      Wait 20 seconds from
                    </label>
                    <input id="${ATTACK_ALARM.delayStartInputId}" type="time" aria-label="Delay start time">
                    to
                    <input id="${ATTACK_ALARM.delayEndInputId}" type="time" aria-label="Delay end time">
                  </div>
                  <p class="egeltools-settings__sound-status" id="${ATTACK_ALARM.statusId}"
                    role="status" aria-live="polite"></p>
                </div>
                <div class="egeltools-settings__feature egeltools-settings__feature--alarm">
                  <p class="egeltools-settings__feature-title">Alarm sound</p>
                  <p class="egeltools-settings__feature-copy">
                    Use GRCRT or a YouTube link. FV claims keep their own sound.
                  </p>
                  <div class="egeltools-settings__sound-row">
                    <input class="egeltools-settings__sound-input" id="${ATTACK_ALARM.soundInputId}"
                      type="url" inputmode="url" autocomplete="off" spellcheck="false"
                      aria-label="YouTube alarm link"
                      aria-describedby="${ATTACK_ALARM.soundStatusId}"
                      placeholder="https://www.youtube.com/watch?v=…">
                    <button class="egeltools-settings__sound-button" id="${ATTACK_ALARM.soundSaveButtonId}"
                      type="button">Save</button>
                    <button class="egeltools-settings__sound-button egeltools-settings__sound-button--secondary"
                      id="${ATTACK_ALARM.soundTestButtonId}" type="button">Test</button>
                    <button class="egeltools-settings__sound-button egeltools-settings__sound-button--secondary"
                      id="${ATTACK_ALARM.soundDefaultButtonId}" type="button">Default</button>
                  </div>
                  <p class="egeltools-settings__sound-status" id="${ATTACK_ALARM.soundStatusId}"
                    role="status" aria-live="polite"></p>
                </div>
                <div class="egeltools-settings__feature egeltools-settings__feature--olympics">
                  <div class="egeltools-settings__feature-heading">
                    <div>
                      <p class="egeltools-settings__feature-title">Celebrations</p>
                      <p class="egeltools-settings__feature-copy">Optional premium action for PartyTracker.</p>
                    </div>
                    <label class="egeltools-settings__option egeltools-settings__option--inline"
                      for="${CELEBRATION_FINDER.olympicsSettingId}">
                      <input id="${CELEBRATION_FINDER.olympicsSettingId}" type="checkbox">
                      Olympic Games <span class="egeltools-settings__option-note">${CELEBRATION_FINDER.olympicsGoldCost} gold</span>
                    </label>
                  </div>
                </div>
      </div>`;

    settingsWindow.querySelector('.egeltools-window__close').addEventListener('click', closeSettings);
    makeDraggable(settingsWindow);
    document.body.append(settingsWindow);
    window.addEventListener('resize', () => keepSettingsWindowInViewport(settingsWindow));
    const olympicsSetting = settingsWindow.querySelector(`#${CELEBRATION_FINDER.olympicsSettingId}`);
    olympicsSetting.checked = getOlympicsEnabled();
    olympicsSetting.addEventListener('change', () => {
      setOlympicsEnabled(olympicsSetting.checked);
      if (celebrationFinderOpen) renderCelebrationFinder();
    });

    const soundInput = settingsWindow.querySelector(`#${ATTACK_ALARM.soundInputId}`);
    const soundSaveButton = settingsWindow.querySelector(`#${ATTACK_ALARM.soundSaveButtonId}`);
    const soundTestButton = settingsWindow.querySelector(`#${ATTACK_ALARM.soundTestButtonId}`);
    const soundDefaultButton = settingsWindow.querySelector(`#${ATTACK_ALARM.soundDefaultButtonId}`);
    const soundStatus = settingsWindow.querySelector(`#${ATTACK_ALARM.soundStatusId}`);
    soundInput.value = getAttackAlarmSoundUrl();

    const setSoundStatus = (message, isError = false) => {
      soundStatus.textContent = message;
      soundStatus.dataset.error = String(isError);
    };
    const stopSoundTest = () => {
      collectAlarmController?.stopTest();
      soundTestButton.textContent = 'Test';
      soundTestButton.setAttribute('aria-pressed', 'false');
    };
    const saveSound = () => {
      const source = getAttackAlarmSoundSource(soundInput.value);
      if (source.type === 'invalid') {
        setSoundStatus('Enter a valid YouTube video link, or leave the field empty.', true);
        soundInput.focus();
        return false;
      }

      if (source.type === 'default') {
        localStorage.removeItem(ATTACK_ALARM.soundKey);
        soundInput.value = '';
        setSoundStatus('Using GRCRT\'s default attack alarm.');
      } else {
        localStorage.setItem(ATTACK_ALARM.soundKey, source.url);
        soundInput.value = source.url;
        setSoundStatus('YouTube alarm sound saved.');
      }
      window.dispatchEvent(new CustomEvent(ATTACK_ALARM.soundChangedEvent));
      return true;
    };

    soundSaveButton.addEventListener('click', () => {
      stopSoundTest();
      saveSound();
    });
    soundInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      stopSoundTest();
      saveSound();
    });
    soundTestButton.addEventListener('click', () => {
      if (soundTestButton.getAttribute('aria-pressed') === 'true') {
        stopSoundTest();
        setSoundStatus('Test stopped.');
        return;
      }

      const source = getAttackAlarmSoundSource(soundInput.value);
      if (source.type === 'invalid') {
        setSoundStatus('Enter a valid YouTube video link, or leave the field empty.', true);
        soundInput.focus();
        return;
      }
      collectAlarmController?.startTest(source, () => {
        soundTestButton.textContent = 'Test';
        soundTestButton.setAttribute('aria-pressed', 'false');
      });
      soundTestButton.textContent = 'Stop';
      soundTestButton.setAttribute('aria-pressed', 'true');
      setSoundStatus(source.type === 'youtube' ? 'Playing YouTube test…' : 'Playing GRCRT alarm test…');
    });
    soundDefaultButton.addEventListener('click', () => {
      stopSoundTest();
      soundInput.value = '';
      saveSound();
    });
    setSoundStatus(soundInput.value ? 'Using a saved YouTube attack sound.' : 'Using GRCRT\'s default attack alarm.');

    const attackEnabled = settingsWindow.querySelector(`#${ATTACK_ALARM.enabledInputId}`);
    const mutedPlayers = settingsWindow.querySelector(`#${ATTACK_ALARM.mutedPlayersInputId}`);
    const minimumPoints = settingsWindow.querySelector(`#${ATTACK_ALARM.minimumPointsInputId}`);
    const delayEnabled = settingsWindow.querySelector(`#${ATTACK_ALARM.delayEnabledInputId}`);
    const delayStart = settingsWindow.querySelector(`#${ATTACK_ALARM.delayStartInputId}`);
    const delayEnd = settingsWindow.querySelector(`#${ATTACK_ALARM.delayEndInputId}`);
    const attackStatus = settingsWindow.querySelector(`#${ATTACK_ALARM.statusId}`);
    const attackSettings = getAttackAlarmSettings();
    attackEnabled.checked = attackSettings.enabled;
    mutedPlayers.value = localStorage.getItem(ATTACK_ALARM.mutedPlayersKey) || '';
    minimumPoints.value = String(attackSettings.minimumPoints);
    delayEnabled.checked = attackSettings.delayEnabled;
    delayStart.value = attackSettings.delayStart;
    delayEnd.value = attackSettings.delayEnd;

    const renderAttackSettingState = () => {
      delayStart.disabled = !delayEnabled.checked;
      delayEnd.disabled = !delayEnabled.checked;
      attackStatus.textContent = attackEnabled.checked
        ? 'Alarm rules are active.'
        : 'Incoming-attack alarm is disabled.';
      attackStatus.dataset.error = 'false';
    };
    const saveAttackSettings = () => {
      const points = Math.max(0, Number.parseInt(minimumPoints.value || '0', 10) || 0);
      minimumPoints.value = String(points);
      localStorage.setItem(ATTACK_ALARM.enabledKey, attackEnabled.checked ? 'on' : 'off');
      localStorage.setItem(ATTACK_ALARM.mutedPlayersKey, mutedPlayers.value.trim());
      localStorage.setItem(ATTACK_ALARM.minimumPointsKey, String(points));
      localStorage.setItem(ATTACK_ALARM.delayEnabledKey, delayEnabled.checked ? 'on' : 'off');
      localStorage.setItem(
        ATTACK_ALARM.delayStartKey,
        normalizeClockTime(delayStart.value, '22:00'),
      );
      localStorage.setItem(
        ATTACK_ALARM.delayEndKey,
        normalizeClockTime(delayEnd.value, '08:00'),
      );
      renderAttackSettingState();
      window.dispatchEvent(new CustomEvent(ATTACK_ALARM.settingsChangedEvent));
    };
    mutedPlayers.addEventListener('input', saveAttackSettings);
    [attackEnabled, minimumPoints, delayEnabled, delayStart, delayEnd]
      .forEach((control) => control.addEventListener('change', saveAttackSettings));
    renderAttackSettingState();
    return settingsWindow;
  }

  function toggleSettings() {
    const settingsWindow = createSettingsWindow();
    const launcherButton = document.getElementById(APP.toolDockSettingsButtonId);
    const willOpen = settingsWindow.hidden;

    settingsWindow.hidden = !willOpen;
    launcherButton?.classList.toggle('checked', willOpen);
    launcherButton?.setAttribute('aria-expanded', String(willOpen));

    if (willOpen) {
      const settingsBody = settingsWindow.querySelector('.egeltools-settings__body');
      settingsBody.scrollTop = 0;
      settingsWindow.focus({ preventScroll: true });
      window.requestAnimationFrame(() => {
        settingsBody.scrollTop = 0;
        keepSettingsWindowInViewport(settingsWindow);
      });
    }
  }

  function positionToolDock() {
    const dock = document.getElementById(APP.toolDockId);
    if (!dock) return;
    dock.dataset.anchor = 'bottom-left';
    dock.style.setProperty('left', '10px', 'important');
    dock.style.setProperty('top', 'auto', 'important');
    dock.style.setProperty('right', 'auto', 'important');
    dock.style.setProperty('bottom', '10px', 'important');
  }

  function createToolDock() {
    let dock = document.getElementById(APP.toolDockId);
    if (dock) return dock;

    dock = document.createElement('nav');
    dock.id = APP.toolDockId;
    dock.setAttribute('aria-label', 'EgelTools quick tools');
    dock.innerHTML = `
      <button id="${APP.toolDockSettingsButtonId}" class="egeltools-tool-dock__brand"
        type="button" title="Open EgelTools settings" aria-label="Open EgelTools settings"
        aria-haspopup="dialog" aria-controls="${APP.windowId}" aria-expanded="false">
        ${hedgehogSvg({ className: 'egeltools-tool-dock__logo' })}
        <span class="egeltools-tool-dock__brand-label">Tools</span>
      </button>
      <span id="${APP.toolDockActionsId}"></span>`;
    dock.querySelector(`#${APP.toolDockSettingsButtonId}`).addEventListener('click', toggleSettings);
    document.body.append(dock);
    window.requestAnimationFrame(positionToolDock);
    return dock;
  }

  function mountToolDockButton(button) {
    const actions = createToolDock().querySelector(`#${APP.toolDockActionsId}`);
    button.style.setProperty('display', 'inline-flex', 'important');
    button.style.setProperty('position', 'static', 'important');
    button.style.setProperty('right', 'auto', 'important');
    button.style.setProperty('bottom', 'auto', 'important');
    button.style.setProperty('z-index', 'auto', 'important');
    button.style.setProperty('visibility', 'visible', 'important');
    button.style.setProperty('opacity', '1', 'important');
    if (actions && button.parentElement !== actions) actions.append(button);
    window.requestAnimationFrame(positionToolDock);
    return button;
  }

  let celebrationFinderOpen = false;
  let celebrationRefreshTimer = null;
  const celebrationBulkStartsInFlight = new Set();
  const celebrationStartsInFlight = new Set();

  function getOlympicsEnabled() {
    return localStorage.getItem(CELEBRATION_FINDER.olympicsEnabledKey) === 'on';
  }

  function setOlympicsEnabled(enabled) {
    localStorage.setItem(CELEBRATION_FINDER.olympicsEnabledKey, enabled ? 'on' : 'off');
  }

  function getAvailableGold() {
    const goldElement = document.querySelector('#ui_box .gold_amount, .gold_amount');
    if (!goldElement) return null;

    const gold = Number.parseInt(goldElement.textContent.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(gold) ? gold : null;
  }

  function makeCelebrationFinderDraggable(panel) {
    const handle = panel.querySelector('.egeltools-celebration__header');
    let dragState = null;

    const stopDragging = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragState = null;
      window.removeEventListener('pointermove', movePanel);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };

    const movePanel = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;

      const maxLeft = Math.max(0, window.innerWidth - dragState.width);
      const maxTop = Math.max(0, window.innerHeight - dragState.height);
      panel.style.left = `${Math.min(maxLeft, Math.max(0, event.clientX - dragState.offsetX))}px`;
      panel.style.top = `${Math.min(maxTop, Math.max(0, event.clientY - dragState.offsetY))}px`;
    };

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button')) return;

      const bounds = panel.getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      };

      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = `${bounds.left}px`;
      panel.style.top = `${bounds.top}px`;
      window.addEventListener('pointermove', movePanel);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
      event.preventDefault();
    });
  }

  function createCelebrationFinderButton() {
    let button = document.getElementById(CELEBRATION_FINDER.floatingButtonId);
    if (!button) {
      button = document.createElement('button');
      button.id = CELEBRATION_FINDER.floatingButtonId;
      button.type = 'button';
      button.setAttribute('aria-controls', CELEBRATION_FINDER.panelId);
      button.setAttribute('aria-expanded', String(celebrationFinderOpen));
      button.textContent = celebrationFinderOpen ? 'Hide CFs' : 'Show CFs';
    }

    return mountToolDockButton(button);
  }

  function createCelebrationFinderPanel() {
    let panel = document.getElementById(CELEBRATION_FINDER.panelId);
    if (panel) return panel;

    panel = document.createElement('section');
    panel.id = CELEBRATION_FINDER.panelId;
    panel.hidden = !celebrationFinderOpen;
    panel.setAttribute('aria-labelledby', 'egeltools-celebration-finder-title');
    panel.innerHTML = `
      <div class="egeltools-celebration__header">
        <span class="egeltools-celebration__title" id="egeltools-celebration-finder-title">
          Available celebrations
        </span>
        <span id="${CELEBRATION_FINDER.bulkActionsId}" aria-label="Bulk celebration actions">
          <button class="egeltools-celebration__bulk-button" type="button"
            data-bulk-celebration-type="party">All CF</button>
          <button class="egeltools-celebration__bulk-button" type="button"
            data-bulk-celebration-type="theater">All Theater</button>
          <button class="egeltools-celebration__bulk-button" type="button"
            data-bulk-celebration-type="games">All Olympics</button>
        </span>
        <button id="${CELEBRATION_FINDER.refreshButtonId}" type="button"
          title="Refresh" aria-label="Refresh celebration finder">&#8635;</button>
        <button id="${CELEBRATION_FINDER.closeButtonId}" type="button"
          title="Close" aria-label="Close celebration finder">&times;</button>
      </div>
      <div id="${CELEBRATION_FINDER.bodyId}" aria-live="polite">
        <p class="egeltools-celebration__state">Loading town data…</p>
      </div>`;
    makeCelebrationFinderDraggable(panel);
    document.body.append(panel);
    if (celebrationFinderOpen) renderCelebrationFinder();
    return panel;
  }

  function encodeTownLinkData(data) {
    const json = JSON.stringify(data);
    const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_match, hex) => (
      String.fromCharCode(Number.parseInt(hex, 16))
    ));
    return window.btoa(binary);
  }

  function getModelAttributes(model) {
    return model && typeof model.attributes === 'object' ? model.attributes : model || {};
  }

  function getTownValue(town, methodName, attributeNames) {
    if (typeof town?.[methodName] === 'function') {
      const value = town[methodName]();
      if (value != null) return value;
    }

    const attributes = getModelAttributes(town);
    for (const name of attributeNames) {
      if (attributes[name] != null) return attributes[name];
      if (typeof town?.get === 'function') {
        const value = town.get(name);
        if (value != null) return value;
      }
    }
    return null;
  }

  let bdLevelRetryTimer = null;
  let islandIdsByCoordinatesPromise = null;

  function loadIslandIdsByCoordinates() {
    if (islandIdsByCoordinatesPromise) return islandIdsByCoordinatesPromise;

    islandIdsByCoordinatesPromise = (async () => {
      const response = await fetch(BD_LEVEL_CHECK.islandDataUrl, {
        credentials: 'same-origin',
      });
      if (!response.ok) throw new Error(`Could not load island data: HTTP ${response.status}`);

      const islandIds = new Map();
      (await response.text()).split(/\r?\n/).filter(Boolean).forEach((line) => {
        const [id, x, y] = line.split(',').map(Number);
        if (Number.isFinite(id) && Number.isFinite(x) && Number.isFinite(y)) {
          islandIds.set(`${x}:${y}`, id);
        }
      });
      return islandIds;
    })().catch((error) => {
      islandIdsByCoordinatesPromise = null;
      throw error;
    });

    return islandIdsByCoordinatesPromise;
  }

  async function resolveIslandId(islandX, islandY, knownIslandId) {
    if (Number.isFinite(knownIslandId) && knownIslandId > 0) return knownIslandId;

    const islandId = (await loadIslandIdsByCoordinates()).get(`${islandX}:${islandY}`);
    if (!Number.isFinite(islandId)) {
      throw new Error(`No island found at ${islandX}/${islandY}`);
    }
    return islandId;
  }

  async function openBdIslandWindow(townLink) {
    const islandX = Number(townLink.dataset.islandX);
    const islandY = Number(townLink.dataset.islandY);
    const knownIslandId = townLink.dataset.islandId
      ? Number(townLink.dataset.islandId)
      : null;
    if (!Number.isFinite(islandX) || !Number.isFinite(islandY)) return;

    const islandId = await resolveIslandId(islandX, islandY, knownIslandId);
    townLink.dataset.islandId = String(islandId);

    const windowManager = window.GPWindowMgr || window.Layout?.wnd;
    const islandWindowType = window.Layout?.wnd?.TYPE_ISLAND
      ?? windowManager?.TYPE_ISLAND;
    if (!windowManager || typeof windowManager.Create !== 'function' || islandWindowType == null) {
      throw new Error('Grepolis legacy island-window manager is unavailable');
    }

    const openIslandWindows = windowManager.getOpen?.(islandWindowType) || [];
    Array.from(openIslandWindows).forEach((islandWindow) => islandWindow?.close?.());

    const islandWindow = windowManager.Create(
      islandWindowType,
      'Island info',
      {},
      { id: islandId, ix: islandX, iy: islandY },
    );
    if (!islandWindow) throw new Error('Grepolis did not create the island window');
  }

  function getModelArray(bucket) {
    if (!bucket) return [];
    if (Array.isArray(bucket)) return bucket;
    if (Array.isArray(bucket.models)) return bucket.models;
    if (bucket.models && typeof bucket.models === 'object') return Object.values(bucket.models);
    if (typeof bucket === 'object') return Object.values(bucket);
    return [];
  }

  function getFirstMethodValue(model, methodNames, attributeNames) {
    for (const methodName of methodNames) {
      if (typeof model?.[methodName] !== 'function') continue;
      const value = model[methodName]();
      if (value != null) return value;
    }

    const attributes = getModelAttributes(model);
    for (const attributeName of attributeNames) {
      if (attributes[attributeName] != null) return attributes[attributeName];
      if (model?.[attributeName] != null) return model[attributeName];
      if (typeof model?.get === 'function') {
        const value = model.get(attributeName);
        if (value != null) return value;
      }
    }
    return null;
  }

  function getIslandUtilityModelContext() {
    const models = window.MM?.getModels?.() || {};
    const collections = window.MM?.getCollections?.() || {};
    const getBucket = (name) => (
      models[name]
      || collections[name]?.[0]
      || collections[name]
      || window.MM?.getOnlyCollectionByName?.(name)
    );
    const farmTowns = getModelArray(getBucket('FarmTown'));
    const relations = getModelArray(getBucket('FarmTownPlayerRelation'));
    if (!farmTowns.length || !relations.length) return null;

    const farmTownById = new Map(farmTowns.map((farmTown) => [String(
      getFirstMethodValue(farmTown, ['getId'], ['id']),
    ), farmTown]));
    const relationByFarmTownId = new Map(relations.map((relation) => [String(
      getFirstMethodValue(relation, ['getFarmTownId'], ['farm_town_id', 'farmTownId']),
    ), relation]));
    return { farmTownById, relationByFarmTownId };
  }

  function getCurrentIslandUtilityTown() {
    return window.ITowns?.getCurrentTown?.()
      || window.ITowns?.getTown?.(window.Game?.townId ?? window.Game?.town_id)
      || null;
  }

  function getIslandUtilityTrade(farmTown) {
    const town = getCurrentIslandUtilityTown();
    const resource = String(getFirstMethodValue(
      farmTown,
      ['getResourceDemand'],
      ['resource_demand', 'resourceDemand'],
    ) || '');
    const resources = getModelAttributes(
      town?.resources?.() || town?.getCurrentResources?.() || {},
    );
    const capacity = Number(town?.getAvailableTradeCapacity?.() || 0);
    const stock = Number(resources[resource] || 0);
    const amount = Math.floor(Math.min(
      ISLAND_UTILITIES.maximumTradeAmount,
      Math.max(0, capacity),
      Math.max(0, stock),
    ));
    return { town, resource, amount };
  }

  function postIslandUtilityAction(actionName, townId, farmTownId, relationId, argumentsData) {
    if (typeof window.gpAjax?.ajaxPost !== 'function') return false;
    window.gpAjax.ajaxPost('frontend_bridge', 'execute', {
      model_url: `FarmTownPlayerRelation/${relationId}`,
      action_name: actionName,
      arguments: {
        farm_town_id: Number.isFinite(Number(farmTownId)) ? Number(farmTownId) : farmTownId,
        ...argumentsData,
      },
      town_id: Number.isFinite(Number(townId)) ? Number(townId) : townId,
    });
    return true;
  }

  function setIslandUtilityButtonDisabled(button, disabled) {
    button.classList.toggle('disabled', disabled);
    button.setAttribute('aria-disabled', String(disabled));
    button.tabIndex = disabled ? -1 : 0;
  }

  function makeIslandUtilityButton({ action, farmTownId, title, right, background }) {
    const button = document.createElement('a');
    button.href = '#';
    button.className = 'button';
    button.dataset.egeltoolsIslandUtility = '';
    button.dataset.islandUtilityAction = action;
    button.dataset.farmTownId = String(farmTownId);
    button.title = title;
    button.setAttribute('aria-label', title);
    button.style.position = 'absolute';
    button.style.top = '3px';
    button.style.right = right;
    button.innerHTML = `
      <span class="left"><span class="right"><span class="middle mid" style="min-width: 26px">
        <span class="img_trade" style="width: 27px; height: 27px; top: -3px; float: left; position: relative; background: ${background}"></span>
      </span></span></span>`;
    button.addEventListener('keydown', (event) => {
      if (event.key !== ' ' || button.classList.contains('disabled')) return;
      event.preventDefault();
      button.click();
    });
    return button;
  }

  function mountIslandUtilityForHost(host, context) {
    if (host.querySelector(`:scope > ${ISLAND_UTILITIES.buttonSelector}`)) return;
    const farmTownId = Array.from(host.classList).reduce((found, className) => (
      found || className.match(/^farm_town_el_(\d+)$/)?.[1] || null
    ), null);
    if (!farmTownId) return;

    const farmTown = context.farmTownById.get(String(farmTownId));
    const relation = context.relationByFarmTownId.get(String(farmTownId));
    if (!farmTown || !relation) return;
    const relationId = getFirstMethodValue(relation, ['getId'], ['id']);
    if (relationId == null) return;

    const trade = getIslandUtilityTrade(farmTown);
    const tradeTitle = trade.amount >= ISLAND_UTILITIES.minimumTradeAmount
      ? `Trade up to ${trade.amount.toLocaleString()} ${trade.resource} with this FV`
      : 'At least 100 resources and merchant capacity are required';
    const tradeButton = makeIslandUtilityButton({
      action: 'trade',
      farmTownId,
      title: tradeTitle,
      right: '3px',
      background: 'url(&quot;https://flasktools.altervista.org/images/cjq6d72qk521ig1zz.png&quot;) no-repeat',
    });
    setIslandUtilityButtonDisabled(
      tradeButton,
      trade.amount < ISLAND_UTILITIES.minimumTradeAmount,
    );
    tradeButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (tradeButton.classList.contains('disabled')) return;
      const current = getIslandUtilityTrade(farmTown);
      if (!current.town || current.amount < ISLAND_UTILITIES.minimumTradeAmount) {
        setIslandUtilityButtonDisabled(tradeButton, true);
        tradeButton.title = 'At least 100 resources and merchant capacity are required';
        tradeButton.setAttribute('aria-label', tradeButton.title);
        return;
      }
      postIslandUtilityAction(
        'trade',
        getFirstMethodValue(current.town, ['getId'], ['id']) ?? window.Game?.townId,
        farmTownId,
        relationId,
        { amount: current.amount },
      );
    });
    host.append(tradeButton);

    const expansionStage = Number(getFirstMethodValue(
      relation,
      ['getExpansionStage'],
      ['expansion_stage'],
    ));
    const expansionAt = getFirstMethodValue(relation, ['getExpansionAt'], ['expansion_at']);
    if (!Number.isFinite(expansionStage) || expansionStage < BD_LEVEL_CHECK.maximumLevel) {
      const isLocked = Number(getFirstMethodValue(
        relation,
        ['getRelationStatus'],
        ['relation_status'],
      )) === 0;
      const action = isLocked ? 'unlock' : 'upgrade';
      const title = expansionAt != null
        ? 'FV upgrade already in progress'
        : `${isLocked ? 'Unlock' : 'Upgrade'} this FV`;
      const upgradeButton = makeIslandUtilityButton({
        action,
        farmTownId,
        title,
        right: '47px',
        background: 'url(&quot;https://gpit.innogamescdn.com/images/game/autogenerated/battle_point_villages/battle_point_villages_e6b65fc.png&quot;) no-repeat -895px -313px',
      });
      setIslandUtilityButtonDisabled(upgradeButton, expansionAt != null);
      upgradeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const town = getCurrentIslandUtilityTown();
        if (!town || upgradeButton.classList.contains('disabled')) return;
        if (postIslandUtilityAction(
          action,
          getFirstMethodValue(town, ['getId'], ['id']) ?? window.Game?.townId,
          farmTownId,
          relationId,
          {},
        )) {
          setIslandUtilityButtonDisabled(upgradeButton, true);
          upgradeButton.title = action === 'unlock'
            ? 'FV unlock requested'
            : 'FV upgrade requested';
          upgradeButton.setAttribute('aria-label', upgradeButton.title);
        }
      });
      host.append(upgradeButton);
    }
  }

  function mountIslandUtilityButtons(root = document) {
    const context = getIslandUtilityModelContext();
    if (!context) return 0;
    const hosts = [];
    if (root instanceof Element && root.matches(ISLAND_UTILITIES.hostSelector)) hosts.push(root);
    root.querySelectorAll?.(ISLAND_UTILITIES.hostSelector).forEach((host) => hosts.push(host));
    hosts.forEach((host) => mountIslandUtilityForHost(host, context));
    return hosts.length;
  }

  let islandUtilityMountQueued = false;
  function scheduleIslandUtilityMount() {
    if (islandUtilityMountQueued) return;
    islandUtilityMountQueued = true;
    window.requestAnimationFrame(() => {
      islandUtilityMountQueued = false;
      mountIslandUtilityButtons();
    });
  }

  function initIslandUtilities() {
    scheduleIslandUtilityMount();
    const windowOpenEvent = window.GameEvents?.window?.open;
    if (!windowOpenEvent || typeof window.$?.Observer !== 'function') return;
    try {
      window.$.Observer(windowOpenEvent).subscribe(
        'EGELTOOLS_ISLAND_UTILITIES',
        (_event, islandWindow) => {
          if (islandWindow?.context && islandWindow.context !== 'island') return;
          [0, 50, 150, 400].forEach((delay) => window.setTimeout(
            scheduleIslandUtilityMount,
            delay,
          ));
        },
      );
    } catch (error) {
      console.debug(`[${APP.name}] could not subscribe to island-window events`, error);
    }
  }

  function getBdLevelCheckData() {
    if (typeof window.MM?.getModels !== 'function' || typeof window.ITowns?.getTowns !== 'function') {
      return null;
    }

    const models = window.MM.getModels() || {};
    const collections = window.MM?.getCollections?.() || {};
    const relations = getModelArray(
      models.FarmTownPlayerRelation
      || collections.FarmTownPlayerRelation?.[0]
      || collections.FarmTownPlayerRelation,
    );
    const farmTowns = getModelArray(
      models.FarmTown || collections.FarmTown?.[0] || collections.FarmTown,
    );
    const towns = getModelArray(window.ITowns.getTowns());
    if (!relations.length || !farmTowns.length || !towns.length) return null;

    const farmTownById = new Map(farmTowns.map((farmTown) => [String(
      getFirstMethodValue(farmTown, ['getId'], ['id']),
    ), farmTown]));

    return relations.flatMap((relation) => {
      const farmTownId = getFirstMethodValue(
        relation,
        ['getFarmTownId'],
        ['farm_town_id', 'farmTownId'],
      );
      const farmTown = farmTownById.get(String(farmTownId));
      if (!farmTown) return [];

      let level = Number(getFirstMethodValue(
        relation,
        ['getExpansionStage'],
        ['expansion_stage'],
      ));
      const upgradeCost = getFirstMethodValue(
        relation,
        ['getUpgradeCost'],
        ['upgrade_cost'],
      );
      // Grepolis represents a not-yet-expanded farming village as stage 1
      // with the sentinel upgrade cost 1.
      if (level === 1 && Number(upgradeCost) === 1) level = 0;
      if (!Number.isFinite(level) || level >= BD_LEVEL_CHECK.maximumLevel) return [];

      const islandX = Number(getFirstMethodValue(
        farmTown,
        ['getIslandX', 'getIslandCoordinateX'],
        ['island_x', 'islandX'],
      ));
      const islandY = Number(getFirstMethodValue(
        farmTown,
        ['getIslandY', 'getIslandCoordinateY'],
        ['island_y', 'islandY'],
      ));
      const town = towns.find((candidate) => (
        Number(getFirstMethodValue(
          candidate,
          ['getIslandCoordinateX', 'getIslandX'],
          ['island_x', 'islandX', 'ix'],
        )) === islandX
        && Number(getFirstMethodValue(
          candidate,
          ['getIslandCoordinateY', 'getIslandY'],
          ['island_y', 'islandY', 'iy'],
        )) === islandY
      ));
      if (!town) return [];

      const townId = getFirstMethodValue(town, ['getId'], ['id']);
      const townName = String(getFirstMethodValue(town, ['getName'], ['name']) || townId);
      const islandId = getFirstMethodValue(town, ['getIslandId'], ['island_id', 'islandId']);
      let linkFragment = null;
      if (typeof town.getLinkFragment === 'function') {
        try {
          linkFragment = town.getLinkFragment();
        } catch (error) {
          console.debug(`[${APP.name}] could not read a town link fragment`, error);
        }
      }
      if (!linkFragment) {
        linkFragment = encodeTownLinkData({
          id: townId,
          ix: islandX,
          iy: islandY,
          tp: 'town',
          name: townName,
        });
      }

      return [{
        farmTownId,
        level,
        islandX,
        islandY,
        islandId,
        townId,
        townName,
        linkFragment,
      }];
    }).sort((left, right) => (
      left.townName.localeCompare(right.townName) || left.level - right.level
    ));
  }

  function setBdLevelPanelCollapsed(panel, collapsed) {
    panel.dataset.collapsed = String(collapsed);
    localStorage.setItem(BD_LEVEL_CHECK.collapsedKey, collapsed ? 'on' : 'off');
    const toggle = panel.querySelector(`#${BD_LEVEL_CHECK.toggleId}`);
    toggle?.setAttribute('aria-expanded', String(!collapsed));
    if (toggle) toggle.title = collapsed ? 'Show FV levels' : 'Hide FV levels';
  }

  function positionBdLevelPanel(panel, claimWindow) {
    const bounds = claimWindow.getBoundingClientRect();
    const rightSpace = window.innerWidth - bounds.right;
    panel.dataset.side = rightSpace >= 330 || rightSpace >= bounds.left ? 'right' : 'left';
  }

  function scheduleBdLevelRetry() {
    if (bdLevelRetryTimer !== null) return;
    bdLevelRetryTimer = window.setTimeout(() => {
      bdLevelRetryTimer = null;
      renderBdLevelPanel();
    }, BD_LEVEL_CHECK.retryInterval);
  }

  function renderBdLevelPanel() {
    const panel = document.getElementById(BD_LEVEL_CHECK.panelId);
    if (!panel) return;

    const body = panel.querySelector(`#${BD_LEVEL_CHECK.bodyId}`);
    const count = panel.querySelector(`#${BD_LEVEL_CHECK.countId}`);
    if (!body || !count) return;

    const entries = getBdLevelCheckData();
    body.replaceChildren();
    if (entries === null) {
      count.textContent = '…';
      const state = document.createElement('p');
      state.className = 'egeltools-bd-level__state';
      state.textContent = 'Waiting for farming-village data…';
      body.append(state);
      scheduleBdLevelRetry();
      return;
    }

    if (bdLevelRetryTimer !== null) {
      window.clearTimeout(bdLevelRetryTimer);
      bdLevelRetryTimer = null;
    }
    count.textContent = String(entries.length);

    if (!entries.length) {
      const state = document.createElement('p');
      state.className = 'egeltools-bd-level__state';
      state.textContent = 'All farming villages are level 6.';
      body.append(state);
      return;
    }

    const islands = new Map();
    entries.forEach((entry) => {
      const islandKey = `${entry.islandX}:${entry.islandY}`;
      const island = islands.get(islandKey) || { ...entry, levels: [] };
      island.levels.push(entry.level);
      islands.set(islandKey, island);
    });

    const list = document.createElement('ul');
    list.className = 'egeltools-bd-level__list';
    islands.forEach((island) => {
      const item = document.createElement('li');
      item.className = 'egeltools-bd-level__item';
      const sortedLevels = island.levels.sort((left, right) => left - right);
      item.append(sortedLevels.length === 1
        ? `FV level ${sortedLevels[0]} — `
        : `${sortedLevels.length} FVs (levels ${sortedLevels.join(', ')}) — `);

      const link = document.createElement('a');
      link.className = 'egeltools-bd-level__town-link';
      link.href = `#${island.linkFragment}`;
      link.dataset.townId = String(island.townId);
      link.dataset.islandX = String(island.islandX);
      link.dataset.islandY = String(island.islandY);
      if (island.islandId != null) link.dataset.islandId = String(island.islandId);
      link.textContent = island.townName;
      link.title = `Open the island overview for ${island.townName}`;
      item.append(link);
      list.append(item);
    });
    body.append(list);
  }

  function getBdLevelClaimWindow() {
    const farmTownWrapper = document.querySelector('#farm_town_wrapper');
    return farmTownWrapper?.closest('.ui-dialog')
      || farmTownWrapper?.closest('[id^="gpwnd_"]')
      || farmTownWrapper?.parentElement
      || null;
  }

  function mountBdLevelPanel() {
    const claimWindow = getBdLevelClaimWindow();
    if (!claimWindow) return null;

    let panel = document.getElementById(BD_LEVEL_CHECK.panelId);
    let shouldRender = false;
    if (!panel) {
      shouldRender = true;
      panel = document.createElement('aside');
      panel.id = BD_LEVEL_CHECK.panelId;
      panel.setAttribute('aria-label', 'Farming-village level check');
      panel.innerHTML = `
        <button id="${BD_LEVEL_CHECK.toggleId}" type="button"
          aria-controls="${BD_LEVEL_CHECK.bodyId}">
          FV levels <span id="${BD_LEVEL_CHECK.countId}">…</span>
        </button>
        <div class="egeltools-bd-level__window">
          <div class="egeltools-bd-level__header">
            <span class="egeltools-bd-level__title">Farming villages below level 6</span>
            <button id="${BD_LEVEL_CHECK.refreshId}" type="button"
              title="Refresh" aria-label="Refresh FV levels">&#8635;</button>
          </div>
          <div id="${BD_LEVEL_CHECK.bodyId}" aria-live="polite"></div>
        </div>`;
      setBdLevelPanelCollapsed(
        panel,
        localStorage.getItem(BD_LEVEL_CHECK.collapsedKey) !== 'off',
      );
      panel.querySelector(`#${BD_LEVEL_CHECK.toggleId}`).addEventListener('click', () => {
        setBdLevelPanelCollapsed(panel, panel.dataset.collapsed !== 'true');
      });
      panel.querySelector(`#${BD_LEVEL_CHECK.refreshId}`).addEventListener('click', () => {
        renderBdLevelPanel();
      });
    }

    if (panel.parentElement !== claimWindow) {
      claimWindow.append(panel);
      shouldRender = true;
    }
    positionBdLevelPanel(panel, claimWindow);
    if (shouldRender) renderBdLevelPanel();
    return panel;
  }

  function getTownStorageCapacity(town) {
    // Grepolis applies town research and global artifact bonuses in these
    // model methods, so the effective capacity is more accurate than a fixed
    // warehouse-level threshold.
    for (const methodName of ['getStorage', 'getStorageCapacity', 'getMaxStorage']) {
      if (typeof town?.[methodName] !== 'function') continue;
      const capacity = Number(town[methodName]());
      if (Number.isFinite(capacity)) return capacity;
    }

    const attributes = getModelAttributes(town);
    const rawCapacity = attributes.storage_capacity ?? attributes.max_storage;
    if (rawCapacity == null) return null;
    const capacity = Number(rawCapacity);
    return Number.isFinite(capacity) ? capacity : null;
  }

  function getTownResources(town) {
    for (const methodName of ['resources', 'getCurrentResources']) {
      if (typeof town?.[methodName] !== 'function') continue;
      try {
        const resources = getModelAttributes(town[methodName]());
        if (['wood', 'stone', 'iron'].every((resource) => Number.isFinite(Number(resources[resource])))) {
          return resources;
        }
      } catch (error) {
        console.debug(`[${APP.name}] could not read town resources`, error);
      }
    }
    return null;
  }

  function canTownHostCityParty(town) {
    const storageCapacity = getTownStorageCapacity(town);
    if (!Number.isFinite(storageCapacity)
      || storageCapacity < CELEBRATION_FINDER.partyStorageRequired
      || typeof town?.buildings !== 'function') {
      return false;
    }

    try {
      const buildings = getModelAttributes(town.buildings());
      return Number(buildings.academy) >= CELEBRATION_FINDER.academyPartyLevel;
    } catch (error) {
      console.debug(`[${APP.name}] could not check city-party eligibility`, error);
      return false;
    }
  }

  function getMissingCelebrationResources(town, celebrationType) {
    const resources = getTownResources(town);
    const costs = CELEBRATION_COSTS[celebrationType];
    if (!resources || !costs) return null;

    return Object.fromEntries(Object.entries(costs).flatMap(([resource, cost]) => {
      const missing = Math.max(0, cost - Number(resources[resource]));
      return missing ? [[resource, missing]] : [];
    }));
  }

  function findTown(townId) {
    if (typeof window.ITowns?.getTown === 'function') {
      const town = window.ITowns.getTown(townId);
      if (town) return town;
    }

    const towns = window.ITowns?.getTowns?.();
    if (!towns) return null;
    if (typeof towns.get === 'function') return towns.get(townId) || towns.get(String(townId));
    return towns[townId] || towns[String(townId)] || Object.values(towns).find((town) => (
      String(getTownValue(town, 'getId', ['id'])) === String(townId)
    ));
  }

  function switchToCelebrationTown(townId, fallbackHash) {
    const numericTownId = Number(townId);
    if (typeof window.HelperTown?.townSwitch === 'function') {
      window.HelperTown.townSwitch(Number.isFinite(numericTownId) ? numericTownId : townId);
      return true;
    }
    if (typeof window.HelperTown?.switchTown === 'function') {
      window.HelperTown.switchTown(Number.isFinite(numericTownId) ? numericTownId : townId);
      return true;
    }

    const town = findTown(townId);
    if (town && typeof window.WMap?.mapJump === 'function') {
      window.WMap.mapJump(town, true);
      return true;
    }

    if (fallbackHash) window.location.hash = fallbackHash;
    return false;
  }

  function getCelebrationFinderData() {
    if (typeof window.MM?.getModels !== 'function' || typeof window.ITowns?.getTowns !== 'function') {
      return null;
    }

    const models = window.MM.getModels();
    const townCollection = window.ITowns.getTowns();
    if (!models || !townCollection) return null;

    const celebrationCollection = models.Celebration;
    const celebrations = !celebrationCollection
      ? []
      : Array.isArray(celebrationCollection.models)
        ? celebrationCollection.models
        : Object.values(celebrationCollection);
    const towns = Array.isArray(townCollection.models)
      ? townCollection.models
      : Object.values(townCollection);
    const availableGold = getAvailableGold();

    const hasCelebration = (townId, type) => celebrations.some((celebration) => {
      const attributes = getModelAttributes(celebration);
      return String(attributes.town_id) === String(townId)
        && attributes.celebration_type === type;
    });

    return towns.flatMap((town) => {
      const townId = getTownValue(town, 'getId', ['id']);
      const townName = getTownValue(town, 'getName', ['name']);
      if (townId == null || townName == null || typeof town.buildings !== 'function') return [];

      let buildings;
      try {
        buildings = getModelAttributes(town.buildings());
      } catch (error) {
        console.debug(`[${APP.name}] could not read buildings for town ${townId}`, error);
        return [];
      }

      const actions = [];
      const makeAction = (type) => {
        if (type === 'games') {
          const missingGold = availableGold === null
            ? 0
            : Math.max(0, CELEBRATION_FINDER.olympicsGoldCost - availableGold);
          return {
            type,
            affordable: missingGold === 0,
            missingResources: {},
            unavailableReason: missingGold ? `Missing ${missingGold.toLocaleString()} gold` : '',
          };
        }

        const missingResources = getMissingCelebrationResources(town, type);
        return {
          type,
          affordable: missingResources !== null && Object.keys(missingResources).length === 0,
          missingResources,
          unavailableReason: '',
        };
      };
      if (
        Number(buildings.theater) === 1
        && Number(buildings.academy) >= CELEBRATION_FINDER.academyTheaterLevel
        && getTownStorageCapacity(town) >= CELEBRATION_FINDER.theaterStorageRequired
        && !hasCelebration(townId, 'theater')
      ) {
        actions.push(makeAction('theater'));
      }
      if (
        Number(buildings.academy) >= CELEBRATION_FINDER.academyPartyLevel
        && getTownStorageCapacity(town) >= CELEBRATION_FINDER.partyStorageRequired
        && !hasCelebration(townId, 'party')
      ) {
        actions.push(makeAction('party'));
      }
      if (
        getOlympicsEnabled()
        && Number(buildings.academy) >= CELEBRATION_FINDER.academyPartyLevel
        && !hasCelebration(townId, 'games')
      ) {
        actions.push(makeAction('games'));
      }
      if (!actions.length) return [];

      return [{
        id: townId,
        name: String(townName),
        islandX: Number(getTownValue(town, 'getIslandX', ['island_x', 'ix'])) || 0,
        islandY: Number(getTownValue(town, 'getIslandY', ['island_y', 'iy'])) || 0,
        actions,
      }];
    }).sort((left, right) => left.name.localeCompare(right.name));
  }

  function showCelebrationMessage(message, isError = false) {
    const method = isError ? 'error' : 'success';
    if (typeof window.HumanMessage?.[method] === 'function') {
      window.HumanMessage[method](message);
    } else if (isError) {
      console.warn(`[${APP.name}] ${message}`);
    } else {
      console.info(`[${APP.name}] ${message}`);
    }
  }

  function formatMissingResources(missingResources) {
    if (missingResources === null) return 'Resource data is not available yet';
    const names = { wood: 'wood', stone: 'stone', iron: 'silver' };
    return Object.entries(missingResources)
      .map(([resource, amount]) => `${amount.toLocaleString()} ${names[resource] || resource}`)
      .join(', ');
  }

  function startCelebration(townId, celebrationType, button, options = {}) {
    const { notify = true, renderAfter = true } = options;
    const town = findTown(townId);
    const costs = CELEBRATION_COSTS[celebrationType];
    const labels = CELEBRATION_LABELS[celebrationType];
    if (!town || !labels) {
      if (notify) showCelebrationMessage('The selected town is no longer available.', true);
      if (renderAfter) renderCelebrationFinder();
      return Promise.resolve(false);
    }

    if (celebrationType === 'games') {
      const availableGold = getAvailableGold();
      if (!getOlympicsEnabled()) {
        if (notify) showCelebrationMessage('Enable Olympic Games in EgelTools settings first.', true);
        if (renderAfter) renderCelebrationFinder();
        return Promise.resolve(false);
      }
      if (availableGold !== null && availableGold < CELEBRATION_FINDER.olympicsGoldCost) {
        if (notify) {
          showCelebrationMessage(
            `Missing ${(CELEBRATION_FINDER.olympicsGoldCost - availableGold).toLocaleString()} gold.`,
            true,
          );
        }
        if (renderAfter) renderCelebrationFinder();
        return Promise.resolve(false);
      }
    } else if (costs) {
      const missingResources = getMissingCelebrationResources(town, celebrationType);
      if (missingResources === null || Object.keys(missingResources).length) {
        if (notify) {
          showCelebrationMessage(
            missingResources === null
              ? 'Resource data is not available yet.'
              : `Missing ${formatMissingResources(missingResources)}.`,
            true,
          );
        }
        if (renderAfter) renderCelebrationFinder();
        return Promise.resolve(false);
      }
    }

    if (typeof window.gpAjax?.ajaxPost !== 'function') {
      if (notify) {
        showCelebrationMessage('Grepolis could not start the celebration because its request service is unavailable.', true);
      }
      return Promise.resolve(false);
    }

    const requestTownId = Number.isFinite(Number(townId)) ? Number(townId) : townId;
    const requestKey = `${requestTownId}:${celebrationType}`;
    if (celebrationStartsInFlight.has(requestKey)) return Promise.resolve(false);

    celebrationStartsInFlight.add(requestKey);
    if (button) {
      button.disabled = true;
      button.textContent = 'Starting…';
    }

    return new Promise((resolve) => {
      const finish = (success, errorMessage = '') => {
        celebrationStartsInFlight.delete(requestKey);
        if (notify) {
          if (success) {
            showCelebrationMessage(`${labels.action} started.`);
          } else {
            showCelebrationMessage(errorMessage || 'The celebration could not be started.', true);
          }
        }
        if (renderAfter) window.setTimeout(renderCelebrationFinder, success ? 250 : 0);
        resolve(success);
      };

      try {
        window.gpAjax.ajaxPost(
          'town_overviews',
          'start_celebration',
          { town_id: requestTownId, celebration_type: celebrationType },
          true,
          (response) => {
            const responseError = response?.error || response?.json?.error;
            finish(!responseError, typeof responseError === 'string' ? responseError : '');
          },
          () => finish(false),
        );
      } catch (error) {
        console.error(`[${APP.name}] failed to start ${celebrationType} in town ${requestTownId}`, error);
        finish(false);
      }
    });
  }

  function updateCelebrationBulkButtons(availableTowns) {
    const container = document.getElementById(CELEBRATION_FINDER.bulkActionsId);
    if (!container) return;

    container.querySelectorAll('[data-bulk-celebration-type]').forEach((button) => {
      const celebrationType = button.dataset.bulkCelebrationType;
      const labels = CELEBRATION_LABELS[celebrationType];
      const hidden = celebrationType === 'games' && !getOlympicsEnabled();
      const affordableCount = Array.isArray(availableTowns)
        ? availableTowns.reduce((count, town) => count + town.actions.filter((action) => (
          action.type === celebrationType
            && action.affordable
            && !celebrationStartsInFlight.has(`${town.id}:${action.type}`)
        )).length, 0)
        : 0;
      const starting = celebrationBulkStartsInFlight.has(celebrationType);

      button.hidden = hidden;
      button.disabled = hidden || starting || affordableCount === 0;
      button.textContent = starting ? 'Starting…' : labels.bulk;
      button.title = starting
        ? `Starting all affordable ${labels.plural}`
        : affordableCount
          ? `Clear the town-group filter and start ${affordableCount} affordable ${labels.plural}`
          : `No affordable ${labels.plural} available`;
      button.setAttribute('aria-label', button.title);
    });
  }

  function getTownGroupCollection() {
    const modernCollections = window.MM?.getCollections?.() || {};
    const bucket = modernCollections.TownGroup || window.MM?.collections?.TownGroup;
    return Array.isArray(bucket) ? bucket[0] : bucket?.[0] || bucket || null;
  }

  async function clearActiveTownGroup() {
    const townGroups = getTownGroupCollection();
    if (!townGroups || typeof townGroups.getActiveGroupId !== 'function') return true;

    const isAllTownsActive = () => Number(townGroups.getActiveGroupId()) === -1;
    if (isAllTownsActive()) return true;

    for (const methodName of ['setActiveGroupId', 'setActiveGroup', 'setActiveTownGroupId']) {
      if (typeof townGroups[methodName] !== 'function') continue;
      try {
        await Promise.resolve(townGroups[methodName](-1));
        if (isAllTownsActive()) return true;
      } catch (error) {
        console.debug(`[${APP.name}] could not clear the town group with ${methodName}`, error);
      }
    }

    const allTownsControl = document.querySelector([
      '#town_groups_list .town_group_-1 > .group_name',
      '#town_groups_list .town_group_-1 > .group_header',
      '#town_groups_list .town_group_-1 > div:first-child',
      '#town_groups_list .town_group_-1',
      '[data-group-id="-1"]',
      '[data-groupid="-1"]',
    ].join(','));
    if (allTownsControl instanceof HTMLElement) {
      allTownsControl.click();
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
    return isAllTownsActive();
  }

  async function startAllCelebrations(celebrationType) {
    const labels = CELEBRATION_LABELS[celebrationType];
    if (!labels || celebrationBulkStartsInFlight.has(celebrationType)) return;

    const availableTowns = getCelebrationFinderData();
    const affordableCount = Array.isArray(availableTowns)
      ? availableTowns.reduce((count, town) => count + town.actions.filter((action) => (
        action.type === celebrationType
          && action.affordable
          && !celebrationStartsInFlight.has(`${town.id}:${action.type}`)
      )).length, 0)
      : 0;
    if (!affordableCount) {
      showCelebrationMessage(`No affordable ${labels.plural} are available to start.`, true);
      updateCelebrationBulkButtons(availableTowns);
      return;
    }
    if (typeof window.gpAjax?.ajaxPost !== 'function') {
      showCelebrationMessage('Grepolis could not start celebrations because its request service is unavailable.', true);
      return;
    }

    celebrationBulkStartsInFlight.add(celebrationType);
    renderCelebrationFinder();
    try {
      if (!(await clearActiveTownGroup())) {
        showCelebrationMessage('Select “All towns” before using the bulk celebration buttons.', true);
        return;
      }

      const success = await new Promise((resolve) => {
        try {
          window.gpAjax.ajaxPost(
            'town_overviews',
            'start_all_celebrations',
            { celebration_type: celebrationType },
            true,
            (response) => {
              const responseError = response?.error || response?.json?.error;
              resolve(!responseError);
            },
            () => resolve(false),
          );
        } catch (error) {
          console.error(`[${APP.name}] failed to bulk-start ${celebrationType}`, error);
          resolve(false);
        }
      });
      showCelebrationMessage(
        success
          ? `All affordable ${labels.plural} were started through Administrator.`
          : `Administrator could not start the available ${labels.plural}.`,
        !success,
      );
    } finally {
      celebrationBulkStartsInFlight.delete(celebrationType);
      window.setTimeout(renderCelebrationFinder, 250);
    }
  }

  function renderCelebrationFinder() {
    const body = document.getElementById(CELEBRATION_FINDER.bodyId);
    if (!body) return;

    const availableTowns = getCelebrationFinderData();
    updateCelebrationBulkButtons(availableTowns);
    body.replaceChildren();

    if (availableTowns === null) {
      const state = document.createElement('p');
      state.className = 'egeltools-celebration__state';
      state.textContent = 'Town and celebration data is not available yet. EgelTools will retry automatically.';
      body.append(state);
      return;
    }

    if (!availableTowns.length) {
      const state = document.createElement('p');
      state.className = 'egeltools-celebration__state';
      state.textContent = getOlympicsEnabled()
        ? 'All eligible city parties, theater performances, and Olympic Games are active.'
        : 'All eligible city parties and theater performances are active.';
      body.append(state);
      return;
    }

    for (const town of availableTowns) {
      const row = document.createElement('div');
      row.className = 'egeltools-celebration__town';

      const link = document.createElement('a');
      link.className = 'gp_town_link egeltools-celebration__town-link';
      link.href = `#${encodeTownLinkData({
        id: town.id,
        ix: town.islandX,
        iy: town.islandY,
        tp: 'town',
        name: town.name,
      })}`;
      link.dataset.townId = String(town.id);
      link.textContent = town.name;

      const actions = document.createElement('span');
      actions.className = 'egeltools-celebration__actions';
      for (const action of town.actions) {
        const labels = CELEBRATION_LABELS[action.type];
        const badge = document.createElement('button');
        badge.type = 'button';
        badge.className = `egeltools-celebration__badge egeltools-celebration__badge--${action.type}`;
        badge.dataset.townId = String(town.id);
        badge.dataset.celebrationType = action.type;
        badge.disabled = !action.affordable
          || celebrationBulkStartsInFlight.has(action.type)
          || celebrationStartsInFlight.has(`${town.id}:${action.type}`);
        badge.textContent = labels.button;
        badge.title = action.affordable
          ? `Start ${labels.action}${action.type === 'games'
            ? ` (${CELEBRATION_FINDER.olympicsGoldCost} gold)`
            : ''}`
          : `Cannot start: ${action.unavailableReason || formatMissingResources(action.missingResources)}`;
        actions.append(badge);
      }

      row.append(link, actions);
      body.append(row);
    }
  }

  function setCelebrationFinderOpen(open) {
    celebrationFinderOpen = open;
    const panel = createCelebrationFinderPanel();
    panel.hidden = !open;

    const floatingButton = createCelebrationFinderButton();
    floatingButton.setAttribute('aria-expanded', String(open));
    floatingButton.textContent = open ? 'Hide CFs' : 'Show CFs';

    if (celebrationRefreshTimer !== null) {
      window.clearInterval(celebrationRefreshTimer);
      celebrationRefreshTimer = null;
    }
    if (open) {
      renderCelebrationFinder();
      celebrationRefreshTimer = window.setInterval(
        renderCelebrationFinder,
        CELEBRATION_FINDER.refreshInterval,
      );
    }
  }

  function initCelebrationFinder() {
    createCelebrationFinderButton();
    createCelebrationFinderPanel();
    window.addEventListener('storage', (event) => {
      if (event.key !== CELEBRATION_FINDER.olympicsEnabledKey) return;
      const olympicsSetting = document.getElementById(CELEBRATION_FINDER.olympicsSettingId);
      if (olympicsSetting) olympicsSetting.checked = getOlympicsEnabled();
      if (celebrationFinderOpen) renderCelebrationFinder();
    });
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;

      const celebrationButton = event.target.closest(
        `#${CELEBRATION_FINDER.panelId} [data-celebration-type][data-town-id]`,
      );
      if (celebrationButton) {
        event.preventDefault();
        event.stopPropagation();
        startCelebration(
          celebrationButton.dataset.townId,
          celebrationButton.dataset.celebrationType,
          celebrationButton,
        );
        return;
      }

      const townLink = event.target.closest(
        `#${CELEBRATION_FINDER.panelId} .egeltools-celebration__town-link[data-town-id]`,
      );
      if (townLink) {
        event.preventDefault();
        event.stopPropagation();
        switchToCelebrationTown(townLink.dataset.townId, townLink.hash);
        return;
      }

      if (event.target.closest(`#${CELEBRATION_FINDER.floatingButtonId}`)) {
        const panel = createCelebrationFinderPanel();
        setCelebrationFinderOpen(panel.hidden);
      } else if (event.target.closest(
        `#${CELEBRATION_FINDER.panelId} [data-bulk-celebration-type]`,
      )) {
        startAllCelebrations(
          event.target.closest(
            `#${CELEBRATION_FINDER.panelId} [data-bulk-celebration-type]`,
          ).dataset.bulkCelebrationType,
        );
      } else if (event.target.closest(`#${CELEBRATION_FINDER.refreshButtonId}`)) {
        renderCelebrationFinder();
      } else if (event.target.closest(`#${CELEBRATION_FINDER.closeButtonId}`)) {
        setCelebrationFinderOpen(false);
      }
    });
  }

  let townDistanceSorterOpen = false;
  let townDistanceReferenceTownId = null;
  let townDistanceSelectedTownId = null;
  let townDistanceRetryTimer = null;

  function makeTownDistanceSorterDraggable(panel) {
    const handle = panel.querySelector('.egeltools-town-distance__header');
    let dragState = null;

    const stopDragging = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragState = null;
      window.removeEventListener('pointermove', movePanel);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };

    const movePanel = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const maxLeft = Math.max(0, window.innerWidth - dragState.width);
      const maxTop = Math.max(0, window.innerHeight - dragState.height);
      panel.style.left = `${Math.min(maxLeft, Math.max(0, event.clientX - dragState.offsetX))}px`;
      panel.style.top = `${Math.min(maxTop, Math.max(0, event.clientY - dragState.offsetY))}px`;
    };

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button')) return;
      const bounds = panel.getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = `${bounds.left}px`;
      panel.style.top = `${bounds.top}px`;
      window.addEventListener('pointermove', movePanel);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
      event.preventDefault();
    });
  }

  function createTownDistanceSorterButton() {
    let button = document.getElementById(TOWN_DISTANCE_SORTER.floatingButtonId);
    if (!button) {
      button = document.createElement('button');
      button.id = TOWN_DISTANCE_SORTER.floatingButtonId;
      button.type = 'button';
      button.setAttribute('aria-controls', TOWN_DISTANCE_SORTER.panelId);
      button.setAttribute('aria-expanded', String(townDistanceSorterOpen));
      button.textContent = townDistanceSorterOpen ? 'Hide distances' : 'Town distances';
    }

    return mountToolDockButton(button);
  }

  function createTownDistanceSorterPanel() {
    let panel = document.getElementById(TOWN_DISTANCE_SORTER.panelId);
    if (panel) return panel;

    panel = document.createElement('section');
    panel.id = TOWN_DISTANCE_SORTER.panelId;
    panel.hidden = !townDistanceSorterOpen;
    panel.setAttribute('aria-labelledby', 'egeltools-town-distance-sorter-title');
    panel.innerHTML = `
      <div class="egeltools-town-distance__header">
        <span class="egeltools-town-distance__title" id="egeltools-town-distance-sorter-title">
          Town distances
        </span>
        <button id="${TOWN_DISTANCE_SORTER.refreshButtonId}" type="button"
          title="Recalculate from the current town" aria-label="Recalculate from the current town">&#8635;</button>
        <button id="${TOWN_DISTANCE_SORTER.closeButtonId}" type="button"
          title="Close" aria-label="Close town distances">&times;</button>
      </div>
      <div id="${TOWN_DISTANCE_SORTER.bodyId}" aria-live="polite">
        <p class="egeltools-town-distance__state">Loading town data…</p>
      </div>`;
    makeTownDistanceSorterDraggable(panel);
    document.body.append(panel);
    return panel;
  }

  function getCurrentTownId() {
    if (window.Game?.townId != null) return window.Game.townId;
    if (typeof window.ITowns?.getCurrentTown === 'function') {
      return getFirstMethodValue(window.ITowns.getCurrentTown(), ['getId'], ['id']);
    }
    return null;
  }

  function getTownCoordinateSources(town, townId) {
    const sources = [];
    const addSource = (source) => {
      if (source && !sources.includes(source)) sources.push(source);
    };
    addSource(town);
    addSource(town?.model);
    if (typeof town?.getModel === 'function') {
      try {
        addSource(town.getModel());
      } catch (error) { /* Some wrappers expose getModel before their model is ready. */ }
    }
    if (typeof window.ITowns?.getTown === 'function') addSource(window.ITowns.getTown(townId));

    const addTownFromBucket = (bucket) => {
      if (!bucket) return;
      if (typeof bucket.get === 'function') {
        addSource(bucket.get(townId));
        addSource(bucket.get(String(townId)));
      }
      addSource(bucket[townId]);
      addSource(bucket[String(townId)]);
      addSource(getModelArray(bucket).find((candidate) => String(
        getFirstMethodValue(candidate, ['getId'], ['id']),
      ) === String(townId)));
    };

    // Current Grepolis clients keep absolute positions on MM's raw Town
    // models, while ITowns may expose a higher-level wrapper without them.
    try {
      addTownFromBucket(window.MM?.getModels?.()?.Town);
      const townCollections = window.MM?.getCollections?.()?.Town;
      addTownFromBucket(townCollections?.[0] || townCollections);
      addTownFromBucket(window.ITowns?.towns_collection?.getTowns?.());
    } catch (error) {
      console.debug(`[${APP.name}] town coordinate models are still loading`, error);
    }
    return sources;
  }

  function getTownCoordinateValue(sources, methodNames, attributeNames) {
    for (const source of sources) {
      const value = getFirstMethodValue(source, methodNames, attributeNames);
      if (value != null && Number.isFinite(Number(value))) return Number(value);
    }
    return Number.NaN;
  }

  function getTownMapPosition(town, townId) {
    const sources = getTownCoordinateSources(town, townId);
    const absoluteX = getTownCoordinateValue(
      sources,
      ['getAbsoluteX', 'getAbsX'],
      ['abs_x', 'absX'],
    );
    const absoluteY = getTownCoordinateValue(
      sources,
      ['getAbsoluteY', 'getAbsY'],
      ['abs_y', 'absY'],
    );
    if (Number.isFinite(absoluteX) && Number.isFinite(absoluteY)) {
      return { x: absoluteX, y: absoluteY };
    }

    const islandX = getTownCoordinateValue(
      sources,
      ['getIslandCoordinateX', 'getIslandX'],
      ['island_x', 'islandX', 'ix'],
    );
    const islandY = getTownCoordinateValue(
      sources,
      ['getIslandCoordinateY', 'getIslandY'],
      ['island_y', 'islandY', 'iy'],
    );
    const offsetX = getTownCoordinateValue(
      sources,
      ['getIslandOffsetX', 'getIslandCoordinateXOffset', 'getOffsetX'],
      ['offset_x', 'offsetX', 'island_x_offset', 'islandOffsetX', 'ox', '_ox'],
    );
    const offsetY = getTownCoordinateValue(
      sources,
      ['getIslandOffsetY', 'getIslandCoordinateYOffset', 'getOffsetY'],
      ['offset_y', 'offsetY', 'island_y_offset', 'islandOffsetY', 'oy', '_oy'],
    );
    if (![islandX, islandY, offsetX, offsetY].every(Number.isFinite)) return null;

    return {
      x: islandX * TOWN_DISTANCE_SORTER.mapTileSize + offsetX,
      y: islandY * TOWN_DISTANCE_SORTER.mapTileSize + offsetY,
    };
  }

  function getTownIslandCoordinates(town, townId) {
    const sources = getTownCoordinateSources(town, townId);
    return {
      x: getTownCoordinateValue(
        sources,
        ['getIslandCoordinateX', 'getIslandX'],
        ['island_x', 'islandX', 'ix'],
      ),
      y: getTownCoordinateValue(
        sources,
        ['getIslandCoordinateY', 'getIslandY'],
        ['island_y', 'islandY', 'iy'],
      ),
    };
  }

  function getTownDistanceSorterData(referenceTownId) {
    if (typeof window.ITowns?.getTowns !== 'function') return null;
    const towns = getModelArray(window.ITowns.getTowns());
    const referenceTown = towns.find((town) => String(
      getFirstMethodValue(town, ['getId'], ['id']),
    ) === String(referenceTownId));
    const referencePosition = getTownMapPosition(referenceTown, referenceTownId);
    if (!referenceTown || !referencePosition) return null;

    const referenceName = String(
      getFirstMethodValue(referenceTown, ['getName'], ['name']) || referenceTownId,
    );
    const distances = towns.flatMap((town) => {
      const id = getFirstMethodValue(town, ['getId'], ['id']);
      const position = getTownMapPosition(town, id);
      if (id == null || !position) return [];

      const islandCoordinates = getTownIslandCoordinates(town, id);
      return [{
        id,
        name: String(getFirstMethodValue(town, ['getName'], ['name']) || id),
        islandX: islandCoordinates.x,
        islandY: islandCoordinates.y,
        distance: Math.hypot(position.x - referencePosition.x, position.y - referencePosition.y),
      }];
    });
    distances.sort((left, right) => (
      left.distance - right.distance || left.name.localeCompare(right.name)
    ));
    return { referenceName, distances, complete: distances.length === towns.length };
  }

  function scheduleTownDistanceRetry() {
    if (townDistanceRetryTimer !== null) window.clearTimeout(townDistanceRetryTimer);
    townDistanceRetryTimer = townDistanceSorterOpen
      ? window.setTimeout(() => {
        townDistanceRetryTimer = null;
        renderTownDistanceSorter();
      }, TOWN_DISTANCE_SORTER.retryInterval)
      : null;
  }

  function selectTownDistanceRow(townId, switchTown = true) {
    townDistanceSelectedTownId = townId;
    const panel = document.getElementById(TOWN_DISTANCE_SORTER.panelId);
    panel?.querySelectorAll('tbody tr[data-town-id]').forEach((row) => {
      row.setAttribute('aria-current', String(row.dataset.townId === String(townId)));
    });
    if (switchTown) switchToCelebrationTown(townId, '');
  }

  function renderTownDistanceSorter() {
    const panel = createTownDistanceSorterPanel();
    const body = panel.querySelector(`#${TOWN_DISTANCE_SORTER.bodyId}`);
    const title = panel.querySelector('.egeltools-town-distance__title');
    if (!body || !title) return;

    const result = getTownDistanceSorterData(townDistanceReferenceTownId);
    body.replaceChildren();
    if (!result) {
      title.textContent = 'Town distances';
      const state = document.createElement('p');
      state.className = 'egeltools-town-distance__state';
      state.textContent = 'Grepolis is still loading town positions. EgelTools will retry automatically.';
      body.append(state);
      scheduleTownDistanceRetry();
      return;
    }

    if (townDistanceRetryTimer !== null) {
      window.clearTimeout(townDistanceRetryTimer);
      townDistanceRetryTimer = null;
    }
    if (!result.complete) scheduleTownDistanceRetry();

    title.textContent = `Distances from ${result.referenceName}`;
    const table = document.createElement('table');
    table.className = 'egeltools-town-distance__table';
    table.innerHTML = '<thead><tr><th>Town</th><th>Distance</th><th>Coordinates</th></tr></thead>';
    const tbody = document.createElement('tbody');
    for (const town of result.distances) {
      const row = document.createElement('tr');
      row.tabIndex = 0;
      row.dataset.townId = String(town.id);
      row.setAttribute('aria-current', String(String(town.id) === String(townDistanceSelectedTownId)));

      const name = document.createElement('td');
      name.textContent = town.name;
      name.title = town.name;
      const distance = document.createElement('td');
      distance.textContent = town.distance.toFixed(1);
      const coordinates = document.createElement('td');
      coordinates.textContent = Number.isFinite(town.islandX) && Number.isFinite(town.islandY)
        ? `(${town.islandX},${town.islandY})`
        : '—';
      row.append(name, distance, coordinates);
      tbody.append(row);
    }
    table.append(tbody);
    body.append(table);
  }

  function setTownDistanceSorterOpen(open) {
    townDistanceSorterOpen = open;
    const panel = createTownDistanceSorterPanel();
    panel.hidden = !open;
    const button = createTownDistanceSorterButton();
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Hide distances' : 'Town distances';
    if (!open) {
      if (townDistanceRetryTimer !== null) window.clearTimeout(townDistanceRetryTimer);
      townDistanceRetryTimer = null;
      return;
    }

    townDistanceReferenceTownId = getCurrentTownId();
    townDistanceSelectedTownId = townDistanceReferenceTownId;
    renderTownDistanceSorter();
  }

  function initTownDistanceSorter() {
    createTownDistanceSorterButton();
    createTownDistanceSorterPanel();
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const row = event.target.closest(`#${TOWN_DISTANCE_SORTER.panelId} tbody tr[data-town-id]`);
      if (row) {
        event.preventDefault();
        selectTownDistanceRow(row.dataset.townId);
        return;
      }
      if (event.target.closest(`#${TOWN_DISTANCE_SORTER.floatingButtonId}`)) {
        setTownDistanceSorterOpen(!townDistanceSorterOpen);
      } else if (event.target.closest(`#${TOWN_DISTANCE_SORTER.refreshButtonId}`)) {
        townDistanceReferenceTownId = getCurrentTownId() ?? townDistanceSelectedTownId;
        townDistanceSelectedTownId = townDistanceReferenceTownId;
        renderTownDistanceSorter();
      } else if (event.target.closest(`#${TOWN_DISTANCE_SORTER.closeButtonId}`)) {
        setTownDistanceSorterOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (!townDistanceSorterOpen || (key !== 'w' && key !== 's')) return;
      const target = event.target;
      if (target instanceof HTMLElement && (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable
      )) return;

      const panel = document.getElementById(TOWN_DISTANCE_SORTER.panelId);
      const rows = [...(panel?.querySelectorAll('tbody tr[data-town-id]') || [])];
      if (!rows.length) return;
      const current = rows.findIndex((row) => row.getAttribute('aria-current') === 'true');
      const next = current === -1
        ? 0
        : key === 'w'
          ? Math.max(0, current - 1)
          : Math.min(rows.length - 1, current + 1);
      event.preventDefault();
      event.stopPropagation();
      if (next === current) return;
      rows[next].click();
      rows[next].focus({ preventScroll: true });
      rows[next].scrollIntoView({ block: 'nearest' });
    }, true);
  }

  let resourceCheckerOpen = false;
  let resourceCheckerRefreshTimer = null;
  const expandedResourceCheckerTowns = new Set();
  const resourceTradesInFlight = new Set();
  let resourceCheckerSort = { key: 'name', direction: 'asc' };
  const RESOURCE_NAMES = Object.freeze({ wood: 'Wood', stone: 'Stone', iron: 'Iron' });

  function getResourceCheckerMinimums() {
    return Object.fromEntries(Object.entries(RESOURCE_CHECKER.thresholds).map(([resource, setting]) => {
      const stored = Number.parseInt(localStorage.getItem(setting.storageKey) || '', 10);
      return [resource, Number.isFinite(stored) && stored >= 0 ? stored : setting.defaultValue];
    }));
  }

  function saveResourceCheckerMinimums(panel) {
    for (const [resource, setting] of Object.entries(RESOURCE_CHECKER.thresholds)) {
      const input = panel.querySelector(`#${setting.inputId}`);
      const parsed = Number.parseInt(input?.value || '', 10);
      const value = Number.isFinite(parsed) ? Math.max(0, parsed) : setting.defaultValue;
      localStorage.setItem(setting.storageKey, String(value));
      if (input) input.value = String(value);
    }
    renderResourceChecker();
  }

  function syncResourceCheckerMinimumInputs(panel) {
    const minimums = getResourceCheckerMinimums();
    for (const [resource, setting] of Object.entries(RESOURCE_CHECKER.thresholds)) {
      const input = panel.querySelector(`#${setting.inputId}`);
      if (input) input.value = String(minimums[resource]);
    }
  }

  function makeResourceIcon(resource) {
    const frame = document.createElement('span');
    frame.className = 'egeltools-resource-checker__icon-frame';
    frame.setAttribute('aria-hidden', 'true');
    const icon = document.createElement('span');
    // These are Grepolis's own small resource-sprite classes. EgelTools only
    // controls their layout and leaves the sprite background to the game.
    icon.className = `resources_small ${resource} egeltools-resource-checker__icon`;
    icon.setAttribute('aria-hidden', 'true');
    icon.title = RESOURCE_NAMES[resource] || resource;
    frame.append(icon);
    return frame;
  }

  function makeResourceAmount(resource, amount, detail = '') {
    const value = document.createElement('span');
    value.className = 'egeltools-resource-checker__resource';
    value.title = `${RESOURCE_NAMES[resource] || resource}: ${Number(amount).toLocaleString()}`;
    value.append(makeResourceIcon(resource));

    const amountText = document.createElement('span');
    amountText.textContent = Number(amount).toLocaleString();
    value.append(amountText);
    if (detail) {
      const detailText = document.createElement('small');
      detailText.textContent = detail;
      value.append(detailText);
    }
    return value;
  }

  function getResourceCheckerServerTime() {
    const serverTime = Number(window.Timestamp?.now?.());
    return Number.isFinite(serverTime) ? serverTime : Math.floor(Date.now() / 1000);
  }

  function normalizeResourceCheckerTimestamp(value) {
    const timestamp = Number(value);
    if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
    return timestamp > 1e12 ? Math.floor(timestamp / 1000) : Math.floor(timestamp);
  }

  function getActiveCityPartyEndTimes() {
    const celebrations = getModelArray(window.MM?.getModels?.()?.Celebration);
    const now = getResourceCheckerServerTime();
    const endByTown = new Map();
    for (const celebration of celebrations) {
      const attributes = getModelAttributes(celebration);
      const type = attributes.celebration_type ?? getFirstMethodValue(
        celebration,
        ['getCelebrationType', 'getType'],
        ['type'],
      );
      if (type !== 'party') continue;
      const townId = getFirstMethodValue(celebration, ['getTownId'], ['town_id', 'townId']);
      if (townId == null) continue;

      let endAt = null;
      for (const methodName of ['getEndAt', 'getEndTime', 'getFinishedAt', 'getCompletionTime']) {
        if (typeof celebration?.[methodName] !== 'function') continue;
        endAt = normalizeResourceCheckerTimestamp(celebration[methodName]());
        if (endAt !== null) break;
      }
      if (endAt === null) {
        endAt = normalizeResourceCheckerTimestamp(
          attributes.end_at
          ?? attributes.ends_at
          ?? attributes.end_time
          ?? attributes.finished_at
          ?? attributes.completion_time,
        );
      }
      if (endAt !== null && endAt <= now) continue;
      const key = String(townId);
      const existing = endByTown.get(key);
      if (!existing || (endAt !== null && (existing.endAt === null || endAt < existing.endAt))) {
        endByTown.set(key, { endAt });
      }
    }
    return endByTown;
  }

  function getTownProductionPerHour(town) {
    const readProduction = (candidate) => {
      const production = getModelAttributes(candidate);
      if (!production || !Object.keys(production).length) return null;
      const values = Object.fromEntries(Object.keys(RESOURCE_CHECKER.thresholds).map((resource) => (
        [resource, Number(production[resource])]
      )));
      return Object.values(values).every((value) => Number.isFinite(value) && value >= 0)
        ? values
        : null;
    };

    for (const methodName of ['getProductionPerHour', 'getProduction', 'getResourceProduction']) {
      if (typeof town?.[methodName] !== 'function') continue;
      try {
        const production = readProduction(town[methodName]());
        if (production) return production;
      } catch (error) {
        console.debug(`[${APP.name}] could not read production for the party lock`, error);
      }
    }

    const attributes = getModelAttributes(town);
    return readProduction(attributes.production_per_hour ?? attributes.production);
  }

  function getLoyaltyClaimIncomePerTown(towns) {
    const models = window.MM?.getModels?.() || {};
    const collections = window.MM?.getCollections?.() || {};
    const relations = getModelArray(
      models.FarmTownPlayerRelation
      || collections.FarmTownPlayerRelation?.[0]
      || collections.FarmTownPlayerRelation,
    );
    const farmTowns = getModelArray(
      models.FarmTown || collections.FarmTown?.[0] || collections.FarmTown,
    );
    const farmTownById = new Map(farmTowns.map((farmTown) => [String(
      getFirstMethodValue(farmTown, ['getId'], ['id']),
    ), farmTown]));
    const incomeByTown = new Map(towns.map((town) => [String(town.id), 0]));

    for (const relation of relations) {
      let level = Number(getFirstMethodValue(
        relation,
        ['getExpansionStage'],
        ['expansion_stage'],
      ));
      const upgradeCost = getFirstMethodValue(relation, ['getUpgradeCost'], ['upgrade_cost']);
      if (level === 1 && Number(upgradeCost) === 1) level = 0;
      const amount = RESOURCE_CHECKER.loyaltyClaimByFarmLevel[level] || 0;
      if (!amount) continue;

      const directTownId = getFirstMethodValue(
        relation,
        ['getTownId'],
        ['town_id', 'townId'],
      );
      let recipientTowns = directTownId == null
        ? []
        : towns.filter((town) => String(town.id) === String(directTownId));
      if (!recipientTowns.length) {
        const farmTownId = getFirstMethodValue(relation, ['getFarmTownId'], ['farm_town_id']);
        const farmTown = farmTownById.get(String(farmTownId));
        const islandX = Number(getFirstMethodValue(
          farmTown,
          ['getIslandX', 'getIslandCoordinateX'],
          ['island_x', 'islandX'],
        ));
        const islandY = Number(getFirstMethodValue(
          farmTown,
          ['getIslandY', 'getIslandCoordinateY'],
          ['island_y', 'islandY'],
        ));
        recipientTowns = towns.filter((town) => (
          town.islandX === islandX && town.islandY === islandY
        ));
      }
      if (!recipientTowns.length) continue;

      // When Grepolis does not expose a direct recipient town, split the
      // island claim across its owned towns instead of counting it once for
      // every town and producing an unsafe optimistic forecast.
      const share = amount / recipientTowns.length;
      for (const town of recipientTowns) {
        const key = String(town.id);
        incomeByTown.set(key, (incomeByTown.get(key) || 0) + share);
      }
    }
    return incomeByTown;
  }

  function addCityPartyForecasts(towns) {
    const partyEndTimes = getActiveCityPartyEndTimes();
    const claimIncomeByTown = getLoyaltyClaimIncomePerTown(towns);
    const now = getResourceCheckerServerTime();
    const partyCosts = CELEBRATION_COSTS.party;

    for (const town of towns) {
      const activeParty = partyEndTimes.get(String(town.id));
      if (!activeParty) {
        town.partyForecast = null;
        continue;
      }
      const secondsRemaining = activeParty.endAt === null
        ? 0
        : Math.max(0, activeParty.endAt - now);
      const production = getTownProductionPerHour(town.model)
        || Object.fromEntries(Object.keys(partyCosts).map((resource) => [resource, 0]));
      const claimCycles = Math.floor(secondsRemaining / RESOURCE_CHECKER.loyaltyClaimInterval);
      const farmIncomePerCycle = claimIncomeByTown.get(String(town.id)) || 0;
      const storageCapacity = getTownStorageCapacity(town.model);
      const futureIncome = Object.fromEntries(Object.keys(partyCosts).map((resource) => {
        const produced = production[resource] * secondsRemaining / 3600;
        const farmed = farmIncomePerCycle * claimCycles;
        return [resource, Math.max(0, Math.floor(produced + farmed))];
      }));
      const projected = Object.fromEntries(Object.keys(partyCosts).map((resource) => {
        const uncapped = town.resources[resource] + futureIncome[resource];
        return [resource, Math.floor(Number.isFinite(storageCapacity)
          ? Math.min(storageCapacity, uncapped)
          : uncapped)];
      }));
      const reserveNow = Object.fromEntries(Object.entries(partyCosts).map(([resource, cost]) => (
        [resource, Math.max(0, cost - futureIncome[resource])]
      )));
      const spendableNow = Object.fromEntries(Object.keys(partyCosts).map((resource) => (
        [resource, Math.max(0, town.resources[resource] - reserveNow[resource])]
      )));
      const shortfall = Object.fromEntries(Object.entries(partyCosts).flatMap(([resource, cost]) => {
        const missing = Math.max(0, cost - projected[resource]);
        return missing ? [[resource, missing]] : [];
      }));
      const lockedResources = Object.fromEntries(Object.entries(reserveNow).flatMap(([resource, reserve]) => (
        reserve > 0 && spendableNow[resource] === 0 ? [[resource, reserve]] : []
      )));
      town.partyForecast = {
        endAt: activeParty.endAt,
        secondsRemaining,
        claimCycles,
        futureIncome,
        projected,
        reserveNow,
        spendableNow,
        shortfall,
        lockedResources,
        locked: Object.keys(lockedResources).length > 0,
      };
    }
  }

  function getResourceCheckerData() {
    if (typeof window.ITowns?.getTowns !== 'function') return null;
    const townModels = getModelArray(window.ITowns.getTowns());
    if (!townModels.length) return null;
    const minimums = getResourceCheckerMinimums();
    const towns = townModels.flatMap((town) => {
      const id = getFirstMethodValue(town, ['getId'], ['id']);
      const name = getFirstMethodValue(town, ['getName'], ['name']);
      const resources = getTownResources(town);
      if (id == null || name == null || !resources) return [];
      const island = getTownIslandCoordinates(town, id);
      return [{
        id,
        name: String(name),
        model: town,
        partyCapable: canTownHostCityParty(town),
        resources: Object.fromEntries(Object.keys(minimums).map((resource) => (
          [resource, Number(resources[resource])]
        ))),
        position: getTownMapPosition(town, id),
        islandX: island.x,
        islandY: island.y,
      }];
    }).sort((left, right) => left.name.localeCompare(right.name));

    if (!towns.length) return null;
    addCityPartyForecasts(towns);
    const shortages = towns.flatMap((town) => {
      // Keep every owned town in `towns` for donor calculations, but only
      // surface receivers that can actually host a city party.
      if (!town.partyCapable) return [];
      const deficits = Object.fromEntries(Object.entries(minimums).flatMap(([resource, minimum]) => {
        const deficit = Math.max(0, minimum - town.resources[resource]);
        return deficit ? [[resource, deficit]] : [];
      }));
      const transferDeficits = Object.fromEntries(Object.keys(minimums).flatMap((resource) => {
        const deficit = Math.max(deficits[resource] || 0, town.partyForecast?.shortfall?.[resource] || 0);
        return deficit ? [[resource, deficit]] : [];
      }));
      return Object.keys(deficits).length || town.partyForecast?.locked
        ? [{ ...town, deficits, transferDeficits }]
        : [];
    });
    return { towns, shortages, minimums, complete: towns.length === townModels.length };
  }

  function getResourceTownDistance(leftTown, rightTown) {
    if (!leftTown.position || !rightTown.position) return Number.POSITIVE_INFINITY;
    return Math.hypot(
      leftTown.position.x - rightTown.position.x,
      leftTown.position.y - rightTown.position.y,
    );
  }

  function getTownAvailableTradeCapacity(town) {
    for (const methodName of [
      'getAvailableTradeCapacity',
      'getTradeCapacityAvailable',
      'getAvailableMerchantCapacity',
    ]) {
      if (typeof town?.[methodName] !== 'function') continue;
      try {
        const capacity = Number(town[methodName]());
        if (Number.isFinite(capacity)) return Math.max(0, Math.floor(capacity));
      } catch (error) {
        console.debug(`[${APP.name}] could not read available trade capacity`, error);
      }
    }
    const attributes = getModelAttributes(town);
    for (const attributeName of [
      'available_trade_capacity',
      'trade_capacity_available',
      'available_merchant_capacity',
    ]) {
      const capacity = Number(attributes[attributeName]);
      if (Number.isFinite(capacity)) return Math.max(0, Math.floor(capacity));
    }
    return null;
  }

  function limitResourceContributions(contributions, capacity) {
    if (!Number.isFinite(capacity)) return contributions;
    const total = Object.values(contributions).reduce((sum, amount) => sum + amount, 0);
    if (total <= capacity) return contributions;
    if (capacity <= 0 || total <= 0) return {};

    const scaled = Object.fromEntries(Object.entries(contributions).map(([resource, amount]) => (
      [resource, Math.floor(amount * capacity / total)]
    )));
    let remainder = capacity - Object.values(scaled).reduce((sum, amount) => sum + amount, 0);
    const byFraction = Object.entries(contributions).sort((left, right) => {
      const leftFraction = left[1] * capacity / total - scaled[left[0]];
      const rightFraction = right[1] * capacity / total - scaled[right[0]];
      return rightFraction - leftFraction;
    });
    for (const [resource] of byFraction) {
      if (remainder <= 0) break;
      scaled[resource] += 1;
      remainder -= 1;
    }
    return Object.fromEntries(Object.entries(scaled).filter(([, amount]) => amount > 0));
  }

  function buildResourceDonorPlan(targetTown, allTowns, minimums) {
    const targetStorage = getTownStorageCapacity(targetTown.model);
    const remaining = Object.fromEntries(Object.entries(
      targetTown.transferDeficits || targetTown.deficits,
    ).map(([resource, deficit]) => (
      [resource, Number.isFinite(targetStorage)
        ? Math.min(deficit, Math.max(0, targetStorage - targetTown.resources[resource]))
        : deficit]
    )).filter(([, amount]) => amount > 0));
    let candidates = allTowns.flatMap((town) => {
      if (String(town.id) === String(targetTown.id) || town.partyForecast?.locked) return [];
      const available = Object.fromEntries(Object.entries(minimums).map(([resource, minimum]) => {
        const protectedStock = Math.max(minimum, town.partyForecast?.reserveNow?.[resource] || 0);
        return [resource, Math.max(0, town.resources[resource] - protectedStock)];
      }));
      const tradeCapacity = getTownAvailableTradeCapacity(town.model);
      return Object.values(available).some((amount) => amount > 0) && tradeCapacity !== 0
        ? [{
          ...town,
          available,
          tradeCapacity,
          distance: getResourceTownDistance(targetTown, town),
        }]
        : [];
    });
    const donors = [];

    while (
      donors.length < RESOURCE_CHECKER.maximumDonorsPerTown
      && candidates.length
      && Object.values(remaining).some((amount) => amount > 0)
    ) {
      const ranked = candidates.map((candidate) => {
        const unlimitedContributions = Object.fromEntries(Object.entries(remaining).flatMap(([resource, needed]) => {
          const amount = Math.min(needed, candidate.available[resource] || 0);
          return amount > 0 ? [[resource, amount]] : [];
        }));
        const contributions = limitResourceContributions(
          unlimitedContributions,
          candidate.tradeCapacity ?? Number.POSITIVE_INFINITY,
        );
        const resourcesCovered = Object.keys(contributions).length;
        const fullyCovered = Object.entries(remaining).filter(([resource, needed]) => (
          needed > 0 && (candidate.available[resource] || 0) >= needed
        )).length;
        const coverage = Object.entries(contributions).reduce((total, [resource, amount]) => (
          total + amount / remaining[resource]
        ), 0);
        return { candidate, contributions, resourcesCovered, fullyCovered, coverage };
      }).filter((rankedCandidate) => rankedCandidate.resourcesCovered > 0)
        .sort((left, right) => (
          right.fullyCovered - left.fullyCovered
          || right.coverage - left.coverage
          || right.resourcesCovered - left.resourcesCovered
          || left.candidate.distance - right.candidate.distance
          || left.candidate.name.localeCompare(right.candidate.name)
        ));
      if (!ranked.length) break;

      const best = ranked[0];
      const total = Object.values(best.contributions).reduce((sum, amount) => sum + amount, 0);
      donors.push({
        ...best.candidate,
        contributions: best.contributions,
        total,
        canTrade: best.candidate.tradeCapacity !== null
          && best.candidate.tradeCapacity >= total
          && typeof window.gpAjax?.ajaxPost === 'function',
        tradeUnavailableReason: best.candidate.tradeCapacity === null
          ? 'Grepolis trade capacity is not available yet'
          : best.candidate.tradeCapacity < total
            ? 'Not enough merchants are available'
            : typeof window.gpAjax?.ajaxPost !== 'function'
              ? 'Grepolis trade service is unavailable'
              : '',
      });
      for (const [resource, amount] of Object.entries(best.contributions)) {
        remaining[resource] = Math.max(0, remaining[resource] - amount);
      }
      candidates = candidates.filter((candidate) => String(candidate.id) !== String(best.candidate.id));
    }

    return {
      donors,
      remaining: Object.fromEntries(Object.entries(remaining).filter(([, amount]) => amount > 0)),
    };
  }

  function makeResourceTownLink(town, className) {
    const link = document.createElement('a');
    link.className = `gp_town_link ${className}`;
    link.href = `#${encodeTownLinkData({
      id: town.id,
      ix: Number.isFinite(town.islandX) ? town.islandX : 0,
      iy: Number.isFinite(town.islandY) ? town.islandY : 0,
      tp: 'town',
      name: town.name,
    })}`;
    link.dataset.resourceTownId = String(town.id);
    link.textContent = town.name;
    link.title = `Switch to ${town.name}`;
    return link;
  }

  function makeResourceDonorList(targetTown, data) {
    const plan = buildResourceDonorPlan(targetTown, data.towns, data.minimums);
    const donors = document.createElement('div');
    donors.className = 'egeltools-resource-checker__donors';
    donors.dataset.donorsForTown = String(targetTown.id);
    donors.hidden = !expandedResourceCheckerTowns.has(String(targetTown.id));

    if (!plan.donors.length) {
      const note = document.createElement('p');
      note.className = 'egeltools-resource-checker__donor-note';
      note.textContent = 'No other town has stock above the configured minimums.';
      donors.append(note);
      return donors;
    }

    for (const donor of plan.donors) {
      const row = document.createElement('div');
      row.className = 'egeltools-resource-checker__donor';
      const link = makeResourceTownLink(donor, 'egeltools-resource-checker__donor-link');
      const amounts = document.createElement('span');
      amounts.className = 'egeltools-resource-checker__donor-resources';
      for (const [resource, amount] of Object.entries(donor.contributions)) {
        amounts.append(makeResourceAmount(resource, amount));
      }
      const distance = document.createElement('span');
      distance.className = 'egeltools-resource-checker__donor-distance';
      distance.textContent = Number.isFinite(donor.distance)
        ? `${donor.distance.toFixed(1)} fields`
        : 'distance unavailable';
      const tradeButton = document.createElement('button');
      tradeButton.type = 'button';
      tradeButton.className = 'egeltools-resource-checker__trade-button';
      tradeButton.dataset.tradeDonorId = String(donor.id);
      tradeButton.dataset.tradeTargetId = String(targetTown.id);
      const tradeKey = `${targetTown.id}:${donor.id}`;
      const trading = resourceTradesInFlight.has(tradeKey);
      tradeButton.disabled = trading || !donor.canTrade;
      tradeButton.textContent = trading ? 'Sending…' : 'Trade';
      tradeButton.title = trading
        ? `Sending resources from ${donor.name} to ${targetTown.name}`
        : donor.canTrade
          ? `Send this safe ${donor.total.toLocaleString()}-resource trade now`
          : donor.tradeUnavailableReason;
      tradeButton.setAttribute('aria-label', tradeButton.title);
      row.append(link, amounts, distance, tradeButton);
      donors.append(row);
    }

    if (Object.keys(plan.remaining).length) {
      const remaining = document.createElement('div');
      remaining.className = 'egeltools-resource-checker__remaining';
      const label = document.createElement('span');
      label.textContent = 'Still missing:';
      const amounts = document.createElement('span');
      amounts.className = 'egeltools-resource-checker__remaining-resources';
      for (const [resource, amount] of Object.entries(plan.remaining)) {
        amounts.append(makeResourceAmount(resource, amount));
      }
      remaining.append(label, amounts);
      donors.append(remaining);
    }
    return donors;
  }

  async function sendResourceTrade(targetTownId, donorTownId) {
    const tradeKey = `${targetTownId}:${donorTownId}`;
    if (resourceTradesInFlight.has(tradeKey)) return;

    // Rebuild the proposal immediately before sending. This prevents a stale
    // open panel from spending stock that has since become party-reserved or
    // consuming merchants that are no longer available.
    let data = getResourceCheckerData();
    let targetTown = data?.shortages.find((town) => String(town.id) === String(targetTownId));
    let plan = targetTown ? buildResourceDonorPlan(targetTown, data.towns, data.minimums) : null;
    let donor = plan?.donors.find((candidate) => String(candidate.id) === String(donorTownId));
    if (!targetTown || !donor || !donor.canTrade || donor.total <= 0) {
      showCelebrationMessage('That safe trade is no longer available. The resource plan was refreshed.', true);
      renderResourceChecker();
      return;
    }
    resourceTradesInFlight.add(tradeKey);
    renderResourceChecker();

    let finished = false;
    const finish = (success, message = '') => {
      if (finished) return;
      finished = true;
      resourceTradesInFlight.delete(tradeKey);
      showCelebrationMessage(
        success
          ? `${donor.name} sent ${donor.total.toLocaleString()} resources to ${targetTown.name}.`
          : message || 'Grepolis could not send the proposed trade.',
        !success,
      );
      window.setTimeout(renderResourceChecker, success ? 300 : 0);
    };

    try {
      // Yield once and recalculate immediately before posting. The request
      // carries the donor town ID explicitly, so the player's selected city
      // never has to change while resources or merchants are revalidated.
      await Promise.resolve();
      data = getResourceCheckerData();
      targetTown = data?.shortages.find((town) => String(town.id) === String(targetTownId));
      plan = targetTown ? buildResourceDonorPlan(targetTown, data.towns, data.minimums) : null;
      donor = plan?.donors.find((candidate) => String(candidate.id) === String(donorTownId));
      if (!targetTown || !donor || !donor.canTrade || donor.total <= 0) {
        finish(false, 'That trade became unsafe before it could be sent, so no resources were moved.');
        return;
      }

      const requestData = {
        id: Number.isFinite(Number(targetTown.id)) ? Number(targetTown.id) : targetTown.id,
        town_id: Number.isFinite(Number(donor.id)) ? Number(donor.id) : donor.id,
        wood: Math.floor(donor.contributions.wood || 0),
        stone: Math.floor(donor.contributions.stone || 0),
        iron: Math.floor(donor.contributions.iron || 0),
      };
      window.gpAjax.ajaxPost(
        'town_info',
        'trade',
        requestData,
        true,
        (response) => {
          const responseError = response?.error || response?.json?.error;
          const unsuccessful = response?.success === false || response?.json?.success === false;
          const failureMessage = responseError || (unsuccessful
            ? response?.message || response?.json?.message
            : '');
          finish(
            !responseError && !unsuccessful,
            typeof failureMessage === 'string' ? failureMessage : '',
          );
        },
        () => finish(false),
      );
    } catch (error) {
      console.error(`[${APP.name}] could not send the resource trade`, error);
      finish(false);
    }
  }

  function formatPartyLockTime(seconds) {
    const totalMinutes = Math.max(0, Math.floor(seconds / 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  function getPartyLockExplanation(forecast) {
    if (forecast.endAt === null) {
      return 'City-party end time is unavailable, so current stock remains reserved.';
    }
    if (Object.keys(forecast.shortfall).length) {
      return `Keep current stock; more resources are still needed before the party ends in ${formatPartyLockTime(forecast.secondsRemaining)}.`;
    }
    return `Keep current stock so the next city party is affordable in ${formatPartyLockTime(forecast.secondsRemaining)}.`;
  }

  function makePartyLockDetail(town) {
    const forecast = town.partyForecast;
    if (!forecast?.locked) return null;
    const detail = document.createElement('div');
    detail.className = 'egeltools-resource-checker__lock-detail';
    const copy = document.createElement('strong');
    const hasShortfall = Object.keys(forecast.shortfall).length > 0;
    copy.textContent = forecast.endAt === null
      ? 'Stock reserved'
      : hasShortfall
        ? `Needs more in ${formatPartyLockTime(forecast.secondsRemaining)}`
        : `Next party safe in ${formatPartyLockTime(forecast.secondsRemaining)}`;
    const amounts = document.createElement('span');
    amounts.className = 'egeltools-resource-checker__remaining-resources';
    const displayedAmounts = hasShortfall ? forecast.shortfall : forecast.lockedResources;
    for (const [resource, amount] of Object.entries(displayedAmounts)) {
      amounts.append(makeResourceAmount(resource, amount));
    }
    const farming = document.createElement('span');
    farming.textContent = forecast.endAt === null
      ? 'No forecast'
      : `${forecast.claimCycles}× claims + production`;
    detail.title = forecast.endAt === null
      ? `${getPartyLockExplanation(forecast)} No future income was assumed.`
      : `${getPartyLockExplanation(forecast)} Forecast includes ${forecast.claimCycles} Villagers' Loyalty claims every 13 minutes plus normal production.`;
    detail.append(copy, amounts, farming);
    return detail;
  }

  function sortResourceCheckerTowns(towns) {
    const { key, direction } = resourceCheckerSort;
    const multiplier = direction === 'desc' ? -1 : 1;
    return [...towns].sort((left, right) => {
      if (key === 'name') return multiplier * left.name.localeCompare(right.name);
      const difference = left.resources[key] - right.resources[key];
      return difference ? multiplier * difference : left.name.localeCompare(right.name);
    });
  }

  function updateResourceCheckerSortControls(panel) {
    panel.querySelectorAll('[data-resource-sort]').forEach((button) => {
      const active = button.dataset.resourceSort === resourceCheckerSort.key;
      button.setAttribute('aria-pressed', String(active));
      const arrow = button.querySelector('[data-resource-sort-arrow]');
      if (arrow) arrow.textContent = active
        ? resourceCheckerSort.direction === 'asc' ? '↑' : '↓'
        : '';
    });
  }

  function makeResourceCheckerDraggable(panel) {
    const handle = panel.querySelector('.egeltools-resource-checker__header');
    let dragState = null;
    const stopDragging = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      dragState = null;
      window.removeEventListener('pointermove', movePanel);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
    const movePanel = (event) => {
      if (!dragState || event.pointerId !== dragState.pointerId) return;
      const maxLeft = Math.max(0, window.innerWidth - dragState.width);
      const maxTop = Math.max(0, window.innerHeight - dragState.height);
      panel.style.left = `${Math.min(maxLeft, Math.max(0, event.clientX - dragState.offsetX))}px`;
      panel.style.top = `${Math.min(maxTop, Math.max(0, event.clientY - dragState.offsetY))}px`;
    };
    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || event.target.closest('button, input')) return;
      const bounds = panel.getBoundingClientRect();
      dragState = {
        pointerId: event.pointerId,
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      };
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.left = `${bounds.left}px`;
      panel.style.top = `${bounds.top}px`;
      window.addEventListener('pointermove', movePanel);
      window.addEventListener('pointerup', stopDragging);
      window.addEventListener('pointercancel', stopDragging);
      event.preventDefault();
    });
  }

  function createResourceCheckerButton() {
    let button = document.getElementById(RESOURCE_CHECKER.floatingButtonId);
    if (!button) {
      button = document.createElement('button');
      button.id = RESOURCE_CHECKER.floatingButtonId;
      button.type = 'button';
      button.setAttribute('aria-controls', RESOURCE_CHECKER.panelId);
      button.setAttribute('aria-expanded', String(resourceCheckerOpen));
      button.textContent = 'Resources';
    }
    return mountToolDockButton(button);
  }

  function createResourceCheckerPanel() {
    let panel = document.getElementById(RESOURCE_CHECKER.panelId);
    if (panel) return panel;
    panel = document.createElement('section');
    panel.id = RESOURCE_CHECKER.panelId;
    panel.hidden = !resourceCheckerOpen;
    panel.setAttribute('aria-labelledby', 'egeltools-resource-checker-title');
    const thresholdFields = Object.entries(RESOURCE_CHECKER.thresholds).map(([resource, setting]) => `
      <label class="egeltools-resource-checker__threshold" title="Minimum ${RESOURCE_NAMES[resource]}">
        <span class="egeltools-resource-checker__icon-frame" aria-hidden="true">
          <span class="resources_small ${resource} egeltools-resource-checker__icon"></span>
        </span>
        <input id="${setting.inputId}" type="number" inputmode="numeric" min="0" step="1000"
          aria-label="Minimum ${RESOURCE_NAMES[resource]}">
      </label>`).join('');
    const resourceSortButtons = Object.keys(RESOURCE_CHECKER.thresholds).map((resource) => `
      <button class="egeltools-resource-checker__sort-button" type="button"
        data-resource-sort="${resource}" aria-label="Sort towns by ${RESOURCE_NAMES[resource]}"
        aria-pressed="false">
        <span class="egeltools-resource-checker__icon-frame" aria-hidden="true">
          <span class="resources_small ${resource} egeltools-resource-checker__icon"></span>
        </span>
        <span>${RESOURCE_NAMES[resource]}</span>
        <span data-resource-sort-arrow></span>
      </button>`).join('');
    panel.innerHTML = `
      <div class="egeltools-resource-checker__header">
        <span class="egeltools-resource-checker__title" id="egeltools-resource-checker-title">
          Resource shortages
        </span>
        <span id="${RESOURCE_CHECKER.countId}">0 towns</span>
        <button id="${RESOURCE_CHECKER.refreshButtonId}" type="button"
          title="Refresh" aria-label="Refresh resource checker">&#8635;</button>
        <button id="${RESOURCE_CHECKER.closeButtonId}" type="button"
          title="Close" aria-label="Close resource checker">&times;</button>
      </div>
      <div class="egeltools-resource-checker__thresholds">
        ${thresholdFields}
        <button id="${RESOURCE_CHECKER.applyButtonId}" type="button">Apply</button>
      </div>
      <div id="${RESOURCE_CHECKER.sorterId}" aria-label="Sort shortage towns">
        <span>Sort:</span>
        <button class="egeltools-resource-checker__sort-button" type="button"
          data-resource-sort="name" aria-pressed="true">
          Town <span data-resource-sort-arrow>↑</span>
        </button>
        ${resourceSortButtons}
      </div>
      <div id="${RESOURCE_CHECKER.bodyId}" aria-live="polite">
        <p class="egeltools-resource-checker__state">Loading town resources…</p>
      </div>`;
    syncResourceCheckerMinimumInputs(panel);
    updateResourceCheckerSortControls(panel);
    makeResourceCheckerDraggable(panel);
    document.body.append(panel);
    return panel;
  }

  function renderResourceChecker() {
    const panel = createResourceCheckerPanel();
    const body = panel.querySelector(`#${RESOURCE_CHECKER.bodyId}`);
    const count = panel.querySelector(`#${RESOURCE_CHECKER.countId}`);
    const button = createResourceCheckerButton();
    if (!body || !count) return;

    const data = getResourceCheckerData();
    updateResourceCheckerSortControls(panel);
    body.replaceChildren();
    if (!data) {
      count.textContent = '…';
      button.textContent = resourceCheckerOpen ? 'Hide resources' : 'Resources';
      const state = document.createElement('p');
      state.className = 'egeltools-resource-checker__state';
      state.textContent = 'Town resources are still loading. Refresh in a moment.';
      body.append(state);
      return;
    }

    count.textContent = `${data.shortages.length} ${data.shortages.length === 1 ? 'town' : 'towns'}`;
    button.textContent = resourceCheckerOpen
      ? 'Hide resources'
      : data.shortages.length ? `Resources (${data.shortages.length})` : 'Resources ✓';

    if (!data.shortages.length) {
      const state = document.createElement('p');
      state.className = 'egeltools-resource-checker__state';
      state.textContent = 'Every town meets all three resource minimums.';
      body.append(state);
      return;
    }

    for (const town of sortResourceCheckerTowns(data.shortages)) {
      const townSection = document.createElement('section');
      townSection.className = 'egeltools-resource-checker__town';
      townSection.dataset.resourceShortageTown = String(town.id);
      const summary = document.createElement('div');
      summary.className = 'egeltools-resource-checker__town-summary';
      const link = makeResourceTownLink(town, 'egeltools-resource-checker__town-link');
      const partyLock = town.partyForecast?.locked ? document.createElement('span') : null;
      if (partyLock) {
        partyLock.className = 'egeltools-resource-checker__party-lock';
        partyLock.textContent = '🔒';
        partyLock.setAttribute('role', 'img');
        partyLock.setAttribute('aria-label', 'Party lock');
        partyLock.title = getPartyLockExplanation(town.partyForecast);
      }
      const deficits = document.createElement('span');
      deficits.className = 'egeltools-resource-checker__deficits';
      const displayedDeficits = town.transferDeficits || town.deficits;
      for (const [resource, deficit] of Object.entries(displayedDeficits)) {
        deficits.append(makeResourceAmount(resource, town.resources[resource], `−${deficit.toLocaleString()}`));
      }
      const findButton = document.createElement('button');
      findButton.type = 'button';
      findButton.className = 'egeltools-resource-checker__find-button';
      findButton.dataset.findResourceDonors = String(town.id);
      const expanded = expandedResourceCheckerTowns.has(String(town.id));
      findButton.setAttribute('aria-expanded', String(expanded));
      findButton.textContent = expanded ? 'Hide' : 'Sources';
      findButton.title = expanded ? 'Hide safe resource sources' : 'Find safe resource sources';
      const canFindResources = Object.keys(town.transferDeficits || town.deficits).length > 0;
      summary.append(link);
      if (partyLock) summary.append(partyLock);
      summary.append(deficits);
      if (canFindResources) summary.append(findButton);
      townSection.append(summary);
      const lockDetail = makePartyLockDetail(town);
      if (lockDetail) townSection.append(lockDetail);
      if (canFindResources) townSection.append(makeResourceDonorList(town, data));
      body.append(townSection);
    }
  }

  function setResourceCheckerOpen(open) {
    resourceCheckerOpen = open;
    const panel = createResourceCheckerPanel();
    panel.hidden = !open;
    const button = createResourceCheckerButton();
    button.setAttribute('aria-expanded', String(open));
    if (resourceCheckerRefreshTimer !== null) {
      window.clearInterval(resourceCheckerRefreshTimer);
      resourceCheckerRefreshTimer = null;
    }
    if (open) {
      renderResourceChecker();
      resourceCheckerRefreshTimer = window.setInterval(
        renderResourceChecker,
        RESOURCE_CHECKER.refreshInterval,
      );
    } else {
      const count = document.getElementById(RESOURCE_CHECKER.countId)?.textContent || '';
      const number = Number.parseInt(count, 10);
      button.textContent = Number.isFinite(number)
        ? number ? `Resources (${number})` : 'Resources ✓'
        : 'Resources';
    }
  }

  function initResourceChecker() {
    const button = createResourceCheckerButton();
    const panel = createResourceCheckerPanel();
    renderResourceChecker();
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const townLink = event.target.closest(
        `#${RESOURCE_CHECKER.panelId} [data-resource-town-id]`,
      );
      if (townLink) {
        event.preventDefault();
        event.stopPropagation();
        switchToCelebrationTown(townLink.dataset.resourceTownId, townLink.hash);
        return;
      }
      const tradeButton = event.target.closest(
        `#${RESOURCE_CHECKER.panelId} [data-trade-donor-id][data-trade-target-id]`,
      );
      if (tradeButton) {
        event.preventDefault();
        event.stopPropagation();
        sendResourceTrade(tradeButton.dataset.tradeTargetId, tradeButton.dataset.tradeDonorId);
        return;
      }
      const donorButton = event.target.closest(
        `#${RESOURCE_CHECKER.panelId} [data-find-resource-donors]`,
      );
      if (donorButton) {
        const townId = donorButton.dataset.findResourceDonors;
        const willExpand = !expandedResourceCheckerTowns.has(townId);
        if (willExpand) expandedResourceCheckerTowns.add(townId);
        else expandedResourceCheckerTowns.delete(townId);
        donorButton.setAttribute('aria-expanded', String(willExpand));
        donorButton.textContent = willExpand ? 'Hide' : 'Sources';
        donorButton.title = willExpand ? 'Hide safe resource sources' : 'Find safe resource sources';
        const donors = panel.querySelector(`[data-donors-for-town="${CSS.escape(townId)}"]`);
        if (donors) donors.hidden = !willExpand;
        return;
      }
      const sortButton = event.target.closest(
        `#${RESOURCE_CHECKER.sorterId} [data-resource-sort]`,
      );
      if (sortButton) {
        const key = sortButton.dataset.resourceSort;
        resourceCheckerSort = resourceCheckerSort.key === key
          ? { key, direction: resourceCheckerSort.direction === 'asc' ? 'desc' : 'asc' }
          : { key, direction: 'asc' };
        renderResourceChecker();
        return;
      }
      if (event.target.closest(`#${RESOURCE_CHECKER.floatingButtonId}`)) {
        setResourceCheckerOpen(!resourceCheckerOpen);
      } else if (event.target.closest(`#${RESOURCE_CHECKER.refreshButtonId}`)) {
        renderResourceChecker();
      } else if (event.target.closest(`#${RESOURCE_CHECKER.closeButtonId}`)) {
        setResourceCheckerOpen(false);
      } else if (event.target.closest(`#${RESOURCE_CHECKER.applyButtonId}`)) {
        saveResourceCheckerMinimums(panel);
      }
    });
    panel.querySelectorAll('.egeltools-resource-checker__threshold input').forEach((input) => {
      input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        saveResourceCheckerMinimums(panel);
      });
    });
    window.addEventListener('storage', (event) => {
      if (!Object.values(RESOURCE_CHECKER.thresholds).some((setting) => (
        setting.storageKey === event.key
      ))) return;
      syncResourceCheckerMinimumInputs(panel);
      renderResourceChecker();
    });
    button.setAttribute('aria-expanded', 'false');
  }

  function initBdLevelCheck() {
    mountBdLevelPanel();
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const townLink = event.target.closest(
        `#${BD_LEVEL_CHECK.panelId} .egeltools-bd-level__town-link[data-town-id]`,
      );
      if (!townLink) return;

      event.preventDefault();
      event.stopPropagation();
      openBdIslandWindow(townLink).catch((error) => {
        console.error(`[${APP.name}] could not open the island window`, error);
      });
    }, true);
    window.addEventListener('resize', () => {
      const panel = document.getElementById(BD_LEVEL_CHECK.panelId);
      const claimWindow = panel?.parentElement;
      if (panel && claimWindow) positionBdLevelPanel(panel, claimWindow);
    });
    window.setInterval(renderBdLevelPanel, BD_LEVEL_CHECK.refreshInterval);
  }

  function initCollectAlarm() {
    const getState = () => localStorage.getItem(COLLECT_ALARM.stateKey) || 'idle';
    const setState = (state) => localStorage.setItem(COLLECT_ALARM.stateKey, state);
    const getTarget = () => Number.parseInt(localStorage.getItem(COLLECT_ALARM.targetKey) || '0', 10);
    const setTarget = (target) => localStorage.setItem(COLLECT_ALARM.targetKey, String(target));
    const getRepeat = () => (localStorage.getItem(COLLECT_ALARM.repeatKey) || 'on') === 'on';
    const setRepeat = (enabled) => localStorage.setItem(COLLECT_ALARM.repeatKey, enabled ? 'on' : 'off');

    const getCaptainState = () => {
      if (document.querySelector('.captain_active')) return 'active';
      if (document.querySelector('.ui_advisors')) return 'inactive';
      return 'unknown';
    };

    let collectionAudio = null;
    let attackAudio = null;
    let attackAudioUrl = '';
    let attackYoutubePlayer = null;
    let testAudio = null;
    let testYoutubePlayer = null;
    let attackRinging = false;
    let collectionPrimed = false;
    let attackPrimed = false;
    let collectionWaitingForGesture = false;
    let attackWaitingForGesture = false;
    let captainWasObservedActive = false;
    const captainStartupGraceEndsAt = Date.now() + COLLECT_ALARM.captainStartupGraceDuration;

    const createYouTubePlayer = (id, source, loop) => {
      document.getElementById(id)?.remove();
      const player = document.createElement('iframe');
      player.id = id;
      player.className = 'egeltools-alarm-youtube-player';
      player.title = 'EgelTools YouTube alarm audio';
      player.allow = 'autoplay; encrypted-media';
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.src = makeYouTubeEmbedUrl(source.videoId, loop);
      document.body.append(player);
      return player;
    };

    const getCollectionAudio = () => {
      if (!collectionAudio) {
        collectionAudio = new Audio(COLLECT_ALARM.soundUrl);
        collectionAudio.loop = getRepeat();
        collectionAudio.preload = 'auto';
        collectionAudio.addEventListener('error', () => {
          console.warn(`[${APP.name}] collection alarm sound could not be loaded`);
        });
      }
      return collectionAudio;
    };

    const getAttackAudio = (source) => {
      if (!attackAudio || attackAudioUrl !== source.url) {
        attackAudio?.pause();
        attackAudio = new Audio(source.url);
        attackAudioUrl = source.url;
        attackAudio.loop = getRepeat();
        attackAudio.preload = 'auto';
        attackAudio.addEventListener('error', () => {
          console.warn(`[${APP.name}] incoming-attack alarm sound could not be loaded`);
        });
      }
      return attackAudio;
    };

    const applyRepeat = () => {
      if (collectionAudio) collectionAudio.loop = getRepeat();
      if (attackAudio) attackAudio.loop = getRepeat();
      if (attackYoutubePlayer?.isConnected && attackRinging) {
        attackYoutubePlayer.remove();
        attackYoutubePlayer = createYouTubePlayer(
          ATTACK_ALARM.youtubePlayerId,
          getAttackAlarmSoundSource(),
          getRepeat(),
        );
      }
    };

    const rewindAudio = (audioElement, label) => {
      if (!audioElement) return;
      audioElement.pause();
      try {
        audioElement.currentTime = 0;
      } catch (error) {
        console.debug(`[${APP.name}] could not rewind the ${label}`, error);
      }
    };

    const stopCollectionSound = () => {
      collectionWaitingForGesture = false;
      rewindAudio(collectionAudio, 'collection alarm');
    };

    const stopAttackMedia = () => {
      attackWaitingForGesture = false;
      attackYoutubePlayer?.remove();
      attackYoutubePlayer = null;
      rewindAudio(attackAudio, 'incoming-attack alarm');
    };

    const startCollectionSound = () => {
      if (getCaptainState() !== 'active' || getState() !== 'ringing') return;
      const alarmAudio = getCollectionAudio();
      alarmAudio.loop = getRepeat();
      const playRequest = alarmAudio.play();
      if (!playRequest || typeof playRequest.catch !== 'function') return;
      playRequest.catch(() => {
        if (collectionWaitingForGesture) return;
        collectionWaitingForGesture = true;
        const retry = () => {
          document.removeEventListener('click', retry, true);
          document.removeEventListener('keydown', retry, true);
          collectionWaitingForGesture = false;
          startCollectionSound();
        };
        document.addEventListener('click', retry, true);
        document.addEventListener('keydown', retry, true);
      });
    };

    const playAttackSound = () => {
      if (!attackRinging) return;
      const configuredSource = getAttackAlarmSoundSource();
      const source = configuredSource.type === 'invalid'
        ? getAttackAlarmSoundSource('')
        : configuredSource;
      if (source.type === 'youtube') {
        if (!attackYoutubePlayer?.isConnected) {
          attackYoutubePlayer = createYouTubePlayer(
            ATTACK_ALARM.youtubePlayerId,
            source,
            getRepeat(),
          );
        }
        return;
      }

      const alarmAudio = getAttackAudio(source);
      alarmAudio.loop = getRepeat();
      const playRequest = alarmAudio.play();
      if (!playRequest || typeof playRequest.catch !== 'function') return;
      playRequest.catch(() => {
        if (attackWaitingForGesture) return;
        attackWaitingForGesture = true;
        const retry = () => {
          document.removeEventListener('click', retry, true);
          document.removeEventListener('keydown', retry, true);
          attackWaitingForGesture = false;
          playAttackSound();
        };
        document.addEventListener('click', retry, true);
        document.addEventListener('keydown', retry, true);
      });
    };

    const primeAudioElement = (audioElement, onPrimed, label) => {
      const originalVolume = audioElement.volume;
      audioElement.volume = 0;
      const playRequest = audioElement.play();
      const restore = () => {
        try {
          audioElement.pause();
          audioElement.currentTime = 0;
        } catch (error) {
          console.debug(`[${APP.name}] could not reset the primed ${label}`, error);
        }
        audioElement.volume = originalVolume;
      };
      if (playRequest && typeof playRequest.then === 'function') {
        playRequest.then(() => {
          restore();
          onPrimed();
        }).catch(() => {
          audioElement.volume = originalVolume;
        });
      } else {
        restore();
        onPrimed();
      }
    };

    const primeAudio = () => {
      if (!collectionPrimed && getState() !== 'ringing') {
        primeAudioElement(
          getCollectionAudio(),
          () => { collectionPrimed = true; },
          'collection alarm',
        );
      }
      const attackSource = getAttackAlarmSoundSource();
      if (!attackPrimed && !attackRinging && attackSource.type !== 'youtube') {
        const source = attackSource.type === 'invalid' ? getAttackAlarmSoundSource('') : attackSource;
        primeAudioElement(
          getAttackAudio(source),
          () => { attackPrimed = true; },
          'incoming-attack alarm',
        );
      }
    };

    const stopTest = () => {
      testYoutubePlayer?.remove();
      testYoutubePlayer = null;
      if (!testAudio) return;
      testAudio.pause();
      try {
        testAudio.currentTime = 0;
      } catch (error) {
        console.debug(`[${APP.name}] could not rewind the alarm test`, error);
      }
      testAudio = null;
    };

    const startTest = (source, onEnded) => {
      stopTest();
      if (source.type === 'youtube') {
        testYoutubePlayer = createYouTubePlayer(
          ATTACK_ALARM.youtubeTestPlayerId,
          source,
          false,
        );
        return;
      }

      testAudio = new Audio(source.url);
      testAudio.preload = 'auto';
      testAudio.addEventListener('ended', () => {
        testAudio = null;
        onEnded?.();
      }, { once: true });
      const playRequest = testAudio.play();
      if (playRequest && typeof playRequest.catch === 'function') {
        playRequest.catch(() => {
          stopTest();
          onEnded?.();
        });
      }
    };

    const startAttackSound = () => {
      attackRinging = true;
      playAttackSound();
    };

    const stopAttackSound = () => {
      attackRinging = false;
      stopAttackMedia();
    };

    collectAlarmController = {
      startTest,
      stopTest,
      startAttack: startAttackSound,
      stopAttack: stopAttackSound,
      isAttackRinging: () => attackRinging,
    };

    const paintRepeatButton = (button) => {
      if (!button) return;
      const enabled = getRepeat();
      button.style.setProperty('background', enabled ? '#3fa34d' : '#c0392b', 'important');
      button.setAttribute('aria-pressed', String(enabled));
      button.title = `Repeat alarm sound: ${enabled ? 'ON' : 'OFF'}`;
      const label = button.querySelector('.m23-repeat-label');
      if (label) label.textContent = enabled ? 'ON' : 'OFF';
    };

    const makeRepeatButton = (anchor) => {
      const size = anchor.offsetWidth || 36;
      const button = document.createElement('div');
      button.id = COLLECT_ALARM.repeatButtonId;
      button.className = 'm23-repeat-btn';
      button.tabIndex = 0;
      button.setAttribute('role', 'button');
      Object.assign(button.style, {
        position: 'absolute',
        zIndex: '9999',
        width: `${size}px`,
        height: `${anchor.offsetHeight || size}px`,
        borderRadius: '50%',
        cursor: 'pointer',
        boxSizing: 'border-box',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      });

      const label = document.createElement('div');
      label.className = 'm23-repeat-label';
      Object.assign(label.style, {
        color: '#fff',
        fontWeight: 'bold',
        lineHeight: '1',
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.max(9, Math.round(size * 0.34))}px`,
        pointerEvents: 'none',
        textShadow: '0 1px 1px rgba(0,0,0,.6)',
      });
      button.append(label);

      const toggleRepeat = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setRepeat(!getRepeat());
        applyRepeat();
        paintRepeatButton(button);
      };
      button.addEventListener('click', toggleRepeat, true);
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') toggleRepeat(event);
      });
      return button;
    };

    const ensureRepeatButton = () => {
      const anchor = document.querySelector(COLLECT_ALARM.repeatAnchorSelector);
      const existing = document.getElementById(COLLECT_ALARM.repeatButtonId);

      if (!anchor) {
        if (existing) existing.style.display = 'none';
        return;
      }

      const parent = anchor.offsetParent || anchor.parentNode;
      if (!parent) return;

      const button = existing || makeRepeatButton(anchor);
      if (button.parentNode !== parent) parent.append(button);
      button.style.display = 'flex';
      button.style.left = `${anchor.offsetLeft - 5}px`;
      button.style.top = `${anchor.offsetTop + anchor.offsetHeight + 6}px`;
      paintRepeatButton(button);
    };

    const ensureFallbackStopButton = () => {
      const fallback = document.getElementById(COLLECT_ALARM.fallbackStopButtonId);
      const realButton = Array.from(document.querySelectorAll(COLLECT_ALARM.stopButtonSelector))
        .find((button) => button !== fallback);

      if (realButton) {
        fallback?.remove();
        return;
      }
      if (fallback?.isConnected) return;

      const toolbar = document.querySelector('.toolbar_buttons');
      if (!toolbar) return;

      const button = document.createElement('div');
      button.id = COLLECT_ALARM.fallbackStopButtonId;
      button.className = 'toolbar_button boerendorpKnop';
      button.tabIndex = 0;
      button.setAttribute('role', 'button');
      button.setAttribute('aria-label', 'Stop collection alarm');
      button.title = 'Stop collection alarm';
      button.innerHTML = `
        <div class="icon boerendorpIcoon inactief">
          <div class="count js-caption boerendorpcounter"></div>
        </div>`;
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') button.click();
      });
      toolbar.append(button);
    };

    const getSelectedDuration = () => {
      const option = document.querySelector(COLLECT_ALARM.activeTimeSelector);
      if (!option) return COLLECT_ALARM.fallbackDuration;

      const durationClass = Array.from(option.classList).find((name) => /^fto_\d+$/.test(name));
      if (!durationClass) return COLLECT_ALARM.fallbackDuration;

      const seconds = Number(durationClass.slice(4));
      return COLLECT_ALARM.allowedDurations.has(seconds)
        ? seconds * 1000
        : COLLECT_ALARM.fallbackDuration;
    };

    const startTimer = () => {
      setTarget(Date.now() + getSelectedDuration());
      setState('running');
      stopCollectionSound();
    };

    const fireAlarm = () => {
      setState('ringing');
      startCollectionSound();
    };

    const stopAlarm = () => {
      setTarget(0);
      setState('idle');
      stopCollectionSound();
    };

    const tick = () => {
      ensureRepeatButton();
      ensureFallbackStopButton();

      const state = getState();
      const captainState = getCaptainState();
      if (captainState === 'active') captainWasObservedActive = true;

      if (
        attackRinging
        && getRepeat()
        && !attackWaitingForGesture
        && !attackYoutubePlayer?.isConnected
        && (!attackAudio || attackAudio.paused)
      ) {
        playAttackSound();
      }

      if (captainState !== 'active') {
        const captainIsStillInitializing = !captainWasObservedActive
          && Date.now() < captainStartupGraceEndsAt;
        if (captainState === 'inactive' && state !== 'idle' && !captainIsStillInitializing) {
          stopAlarm();
        }
        stopCollectionSound();
        return;
      }

      if (state === 'running' && Date.now() >= getTarget()) {
        fireAlarm();
      } else if (
        state === 'ringing'
        && getRepeat()
        && !collectionWaitingForGesture
        && (!collectionAudio || collectionAudio.paused)
      ) {
        startCollectionSound();
      }
    };

    document.addEventListener('click', primeAudio, true);
    document.addEventListener('keydown', primeAudio, true);
    document.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;

      if (event.target.closest(COLLECT_ALARM.collectButtonSelector)) {
        if (getCaptainState() === 'active') startTimer();
      } else if (event.target.closest(COLLECT_ALARM.stopButtonSelector)) {
        if (getState() === 'ringing') stopAlarm();
      }
    }, true);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tick();
    });

    window.addEventListener('storage', (event) => {
      if (event.key === COLLECT_ALARM.stateKey || event.key === COLLECT_ALARM.targetKey) {
        if (getState() !== 'ringing') stopCollectionSound();
        tick();
      } else if (event.key === COLLECT_ALARM.repeatKey) {
        applyRepeat();
        paintRepeatButton(document.getElementById(COLLECT_ALARM.repeatButtonId));
      } else if (event.key === ATTACK_ALARM.soundKey) {
        stopAttackMedia();
        attackAudio = null;
        attackAudioUrl = '';
        attackPrimed = false;
        if (attackRinging) playAttackSound();
      }
    });

    window.addEventListener(ATTACK_ALARM.soundChangedEvent, () => {
      stopAttackMedia();
      attackAudio = null;
      attackAudioUrl = '';
      attackPrimed = false;
      if (attackRinging) playAttackSound();
    });

    getCollectionAudio();
    tick();
    window.setInterval(tick, 1000);
  }

  function initAttackAlarm() {
    const knownAttackIds = new Set();
    const pendingAttacks = new Map();
    const ringingAttackIds = new Set();
    let polling = false;
    let settingsGeneration = 0;
    let playerData = null;
    let playerDataLoadedAt = 0;
    let playerDataPromise = null;
    let townOwnerData = null;
    let townOwnerDataLoadedAt = 0;
    let townOwnerDataPromise = null;
    const startupSilenceEndsAt = Date.now() + ATTACK_ALARM.startupSilenceDuration;

    const getAttributes = (model) => model?.attributes || model || {};
    const firstValue = (...values) => values.find((value) => value !== undefined && value !== null);
    const asNumber = (value) => {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    };
    const asBoolean = (value) => {
      if (value === true || value === false) return value;
      if (value === 1 || value === '1') return true;
      if (value === 0 || value === '0') return false;
      const normalized = String(value ?? '').trim().toLocaleLowerCase();
      if (['true', 'yes', 'incoming', 'in'].includes(normalized)) return true;
      if (['false', 'no', 'outgoing', 'out'].includes(normalized)) return false;
      return null;
    };
    const decodeWorldText = (value) => {
      try {
        return decodeURIComponent(String(value || '').replace(/\+/g, ' '));
      } catch (error) {
        return String(value || '');
      }
    };

    const appendModels = (target, bucket, assumedAttack, requireOwnedDestination = false) => {
      if (!bucket) return;
      if (Array.isArray(bucket)) {
        bucket.forEach((model) => appendModels(
          target,
          model,
          assumedAttack,
          requireOwnedDestination,
        ));
        return;
      }
      if (bucket.models) {
        appendModels(target, bucket.models, assumedAttack, requireOwnedDestination);
        return;
      }
      if (bucket.attributes) {
        target.push({ model: bucket, assumedAttack, requireOwnedDestination });
        return;
      }
      if (
        typeof bucket === 'object'
        && (Object.getPrototypeOf(bucket) === Object.prototype || Object.getPrototypeOf(bucket) === null)
      ) {
        Object.values(bucket).forEach((model) => appendModels(
          target,
          model,
          assumedAttack,
          requireOwnedDestination,
        ));
      }
    };

    const getIncomingAttacks = () => {
      const candidates = [];
      const models = window.MM?.getModels?.() || {};
      const collections = window.MM?.getCollections?.() || {};
      const ownTowns = window.ITowns?.getTowns?.() || {};
      const ownTownIds = new Set();
      if (!Array.isArray(ownTowns) && !ownTowns.models && typeof ownTowns === 'object') {
        Object.keys(ownTowns).forEach((townId) => ownTownIds.add(String(townId)));
      }
      getModelArray(ownTowns).forEach((town) => {
        const townId = firstValue(
          typeof town?.getId === 'function' ? town.getId() : undefined,
          getAttributes(town).id,
          town?.id,
        );
        if (townId !== undefined && townId !== null) ownTownIds.add(String(townId));
      });
      if (window.Game?.townId !== undefined && window.Game?.townId !== null) {
        ownTownIds.add(String(window.Game.townId));
      }
      try {
        window.require?.('helpers/commands')?.getTownIds?.()
          ?.forEach((townId) => ownTownIds.add(String(townId)));
      } catch (error) { /* ITowns and Game.townId remain available as fallbacks. */ }
      let detailedSourceFound = false;
      ['Attack', 'Attacks'].forEach((name) => {
        detailedSourceFound ||= models[name] !== undefined || collections[name] !== undefined;
        // Grepolis also places outgoing and just-landed commands in these
        // generic buckets. Only trust them when their destination is ours.
        appendModels(candidates, models[name], false, true);
        appendModels(candidates, collections[name], false, true);
      });
      ['IncomingAttack', 'IncomingAttacks'].forEach((name) => {
        detailedSourceFound ||= models[name] !== undefined || collections[name] !== undefined;
        appendModels(candidates, models[name], true);
        appendModels(candidates, collections[name], true);
      });
      ['Command', 'Commands', 'MovementsUnits'].forEach((name) => {
        detailedSourceFound ||= models[name] !== undefined || collections[name] !== undefined;
        appendModels(candidates, models[name], false);
        appendModels(candidates, collections[name], false);
      });
      try {
        const movements = window.MM?.getOnlyCollectionByName?.('MovementsUnits');
        if (movements?.getIncomingAttacks) {
          detailedSourceFound = true;
          ownTownIds.forEach((townId) => {
            appendModels(candidates, movements.getIncomingAttacks(Number(townId)), true);
          });
        }
      } catch (error) {
        console.debug(`[${APP.name}] could not read incoming movement models`, error);
      }
      try {
        const attackCollection = window.MM?.getOnlyCollectionByName?.('Attack');
        if (attackCollection) {
          detailedSourceFound = true;
          if (attackCollection.getIncomingAttacksForTown) {
            ownTownIds.forEach((townId) => {
              const townAttacks = attackCollection.getIncomingAttacksForTown(Number(townId));
              appendModels(candidates, townAttacks?.getIncoming?.() || townAttacks, true);
            });
          } else {
            appendModels(candidates, attackCollection, false, true);
          }
        }
      } catch (error) { /* This model is absent in some Grepolis client versions. */ }

      const ownPlayerId = asNumber(window.Game?.player_id);
      const attacks = new Map();

      candidates.forEach(({ model, assumedAttack, requireOwnedDestination }) => {
        const attributes = getAttributes(model);
        const origin = firstValue(attributes.origin_town, attributes.origin, attributes.source_town) || {};
        const destination = firstValue(
          attributes.destination_town,
          attributes.destination,
          attributes.target_town,
        ) || {};
        const type = String(firstValue(
          attributes.type,
          attributes.command_type,
          attributes.movement_type,
          attributes.activity_type,
          '',
        )).toLocaleLowerCase();
        const status = String(firstValue(attributes.status, attributes.state, '')).toLocaleLowerCase();
        if (
          asBoolean(attributes.cancelled) === true
          || asBoolean(attributes.canceled) === true
          || asBoolean(attributes.returning) === true
          || asBoolean(attributes.is_returning) === true
          || asBoolean(attributes.isReturning) === true
          || ['cancelled', 'canceled', 'aborted', 'completed', 'finished', 'landed'].includes(status)
        ) return;
        if (!assumedAttack && !/(attack|coloniz|revolt|conquest)/.test(type)) return;
        if (/(support|return|spy|trade)/.test(type)) return;

        const originPlayerId = asNumber(firstValue(
          origin.player_id,
          origin.playerId,
          origin.player?.id,
          origin.player?.player_id,
          attributes.origin_player_id,
          attributes.origin_player?.id,
          attributes.origin_player?.player_id,
          attributes.attacker_id,
          attributes.attacker?.id,
          attributes.attacker?.player_id,
        ));
        const destinationPlayerId = asNumber(firstValue(
          destination.player_id,
          destination.playerId,
          attributes.destination_player_id,
          attributes.target_player_id,
        ));
        const destinationTownId = firstValue(
          destination.id,
          destination.town_id,
          attributes.destination_town_id,
          attributes.target_town_id,
        );
        const originTownId = firstValue(
          origin.id,
          origin.town_id,
          origin.townId,
          attributes.origin_town_id,
          attributes.source_town_id,
          attributes.home_town_id,
        );
        const explicitlyIncoming = firstValue(
          asBoolean(attributes.incoming),
          asBoolean(attributes.is_incoming),
          asBoolean(attributes.isIncoming),
          asBoolean(attributes.direction),
        );
        const originIsOwn = (
          (ownPlayerId !== null && originPlayerId === ownPlayerId)
          || ownTownIds.has(String(originTownId))
        );
        if (originIsOwn) return;
        if (explicitlyIncoming === false) return;
        const destinationIsOwn = (
          (ownPlayerId !== null && destinationPlayerId === ownPlayerId)
          || ownTownIds.has(String(destinationTownId))
        );
        // A source named "Attack" can contain outgoing and recently completed
        // commands too. Known foreign destinations must never be treated as
        // incoming, regardless of the bucket name or an unreliable direction flag.
        if (
          (destinationTownId !== undefined
            && destinationTownId !== null
            && !ownTownIds.has(String(destinationTownId)))
          || (ownPlayerId !== null
            && destinationPlayerId !== null
            && destinationPlayerId !== ownPlayerId)
        ) return;
        if (requireOwnedDestination && !destinationIsOwn) return;
        if (explicitlyIncoming !== true && !destinationIsOwn && !assumedAttack) return;

        const attackerName = String(firstValue(
          origin.player_name,
          origin.playerName,
          origin.player?.name,
          origin.player?.player_name,
          attributes.origin_player_name,
          attributes.origin_player?.name,
          attributes.origin_player?.player_name,
          attributes.attacker_name,
          attributes.attacker?.name,
          attributes.attacker?.player_name,
          attributes.player_name,
          originPlayerId !== null ? `Player ${originPlayerId}` : 'Unknown player',
        ));
        const id = String(firstValue(
          model.id,
          attributes.id,
          attributes.command_id,
          attributes.movement_id,
          `${originPlayerId || attackerName}:${destinationTownId || ''}:${firstValue(
            attributes.arrival_at,
            attributes.arrival_time,
            attributes.time_completed,
            '',
          )}`,
        ));
        if (!id || attacks.has(id)) return;

        attacks.set(id, {
          id,
          attackerName,
          attackerNameNormalized: normalizePlayerName(attackerName),
          attackerId: originPlayerId,
          originTownId: originTownId === undefined || originTownId === null
            ? null
            : String(originTownId),
          identityKnown: originPlayerId !== null
            || (originTownId !== undefined && originTownId !== null)
            || !/^unknown player$|^player \d+$/i.test(attackerName.trim()),
          points: asNumber(firstValue(
            origin.player_points,
            attributes.origin_player_points,
            attributes.attacker_points,
            attributes.player_points,
          )),
        });
      });

      if (!detailedSourceFound && attacks.size === 0) {
        let count = 0;
        try {
          count = asNumber(
            window.require?.('helpers/commands')?.getTotalCountOfIncomingAttacks?.(),
          ) || 0;
        } catch (error) { /* Fall through to the legacy counter model. */ }
        if (count <= 0) {
          try {
            count = asNumber(
              window.MM?.checkAndPublishRawModel?.('CommandsMenuBubble', {
                id: window.Game?.player_id,
              })?.getIncommingAttacksCommandsCount?.(),
            ) || 0;
          } catch (error) { /* Fall through to the visible toolbar count. */ }
        }
        if (count <= 0) {
          count = asNumber(
            document.querySelector('.activity.attack_indicator.active .count.js-caption')?.textContent,
          ) || 0;
        }
        for (let index = 0; index < count; index += 1) {
          const id = `fallback:${index + 1}`;
          attacks.set(id, {
            id,
            attackerName: 'Unknown player',
            attackerNameNormalized: 'unknown player',
            attackerId: null,
            points: null,
            originTownId: null,
            identityKnown: false,
          });
        }
      }
      return attacks;
    };

    const parseCsvLine = (line) => {
      const result = [];
      let value = '';
      let quoted = false;
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
          if (quoted && line[index + 1] === '"') {
            value += '"';
            index += 1;
          } else {
            quoted = !quoted;
          }
        } else if (character === ',' && !quoted) {
          result.push(value);
          value = '';
        } else {
          value += character;
        }
      }
      result.push(value);
      return result;
    };

    const loadPlayerData = async () => {
      if (playerData && Date.now() - playerDataLoadedAt < ATTACK_ALARM.playerDataTtl) {
        return playerData;
      }
      if (playerDataPromise) return playerDataPromise;
      const worldId = window.Game?.world_id;
      const url = worldId
        ? `https://${worldId}.grepolis.com/data/players.txt`
        : `${window.location.origin}/data/players.txt`;
      playerDataPromise = (async () => {
        try {
          const response = await fetch(url, { credentials: 'same-origin' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const byId = new Map();
          const byName = new Map();
          (await response.text()).split(/\r?\n/).filter(Boolean).forEach((line) => {
            const row = parseCsvLine(line);
            const player = {
              id: asNumber(row[0]),
              name: decodeWorldText(row[1]),
              points: asNumber(row[3]) || 0,
            };
            player.nameNormalized = normalizePlayerName(player.name);
            if (player.id !== null) byId.set(player.id, player);
            byName.set(player.nameNormalized, player);
          });
          playerData = { byId, byName };
          playerDataLoadedAt = Date.now();
        } catch (error) {
          console.warn(`[${APP.name}] could not load player points for attack filtering`, error);
          playerData = null;
        } finally {
          playerDataPromise = null;
        }
        return playerData;
      })();
      return playerDataPromise;
    };

    const loadTownOwnerData = async () => {
      if (townOwnerData && Date.now() - townOwnerDataLoadedAt < ATTACK_ALARM.playerDataTtl) {
        return townOwnerData;
      }
      if (townOwnerDataPromise) return townOwnerDataPromise;
      const worldId = window.Game?.world_id;
      const url = worldId
        ? `https://${worldId}.grepolis.com/data/towns.txt`
        : `${window.location.origin}/data/towns.txt`;
      townOwnerDataPromise = (async () => {
        try {
          const response = await fetch(url, { credentials: 'same-origin' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const byTownId = new Map();
          (await response.text()).split(/\r?\n/).filter(Boolean).forEach((line) => {
            const row = parseCsvLine(line);
            const townId = row[0];
            const playerId = asNumber(row[1]);
            if (townId && playerId !== null) byTownId.set(String(townId), playerId);
          });
          townOwnerData = byTownId;
          townOwnerDataLoadedAt = Date.now();
        } catch (error) {
          console.warn(`[${APP.name}] could not load town owners for attack filtering`, error);
          townOwnerData = null;
        } finally {
          townOwnerDataPromise = null;
        }
        return townOwnerData;
      })();
      return townOwnerDataPromise;
    };

    const getOfficialAttacker = async (attack) => {
      const data = await loadPlayerData();
      if (!data) return null;
      let player = (
        (attack.attackerId !== null ? data.byId.get(attack.attackerId) : null)
        || data.byName.get(attack.attackerNameNormalized)
      );
      if (!player && attack.originTownId !== null) {
        const ownerId = (await loadTownOwnerData())?.get(attack.originTownId);
        if (ownerId !== undefined) player = data.byId.get(ownerId);
      }
      return player || null;
    };

    const getAttackerPoints = async (attack) => {
      if (attack.points !== null) return attack.points;
      return (await getOfficialAttacker(attack))?.points ?? null;
    };

    const isEligible = async (attack, settings) => {
      if (!settings.enabled) return false;
      if (settings.mutedPlayers.length > 0 && !attack.identityKnown) {
        setStatus('Incoming attack detected; waiting for player details to apply mute rules.');
        return false;
      }
      if (settings.mutedPlayers.includes(attack.attackerNameNormalized)) return false;
      if (settings.mutedPlayers.length > 0) {
        const officialPlayer = await getOfficialAttacker(attack);
        if (officialPlayer && settings.mutedPlayers.includes(officialPlayer.nameNormalized)) {
          return false;
        }
      }
      if (settings.minimumPoints <= 0) return true;
      const points = await getAttackerPoints(attack);
      // Fail open: an unavailable world-data file must never hide a real attack.
      return points === null || points >= settings.minimumPoints;
    };

    const setStatus = (message) => {
      const status = document.getElementById(ATTACK_ALARM.statusId);
      if (status) status.textContent = message;
    };

    const removeStopButton = () => document.getElementById(ATTACK_ALARM.stopButtonId)?.remove();
    const stopAttackAlarm = () => {
      ringingAttackIds.clear();
      collectAlarmController?.stopAttack();
      removeStopButton();
    };
    const ensureStopButton = () => {
      let button = document.getElementById(ATTACK_ALARM.stopButtonId);
      if (button) return button;
      button = document.createElement('button');
      button.id = ATTACK_ALARM.stopButtonId;
      button.type = 'button';
      button.textContent = 'Stop attack alarm';
      button.addEventListener('click', () => {
        stopAttackAlarm();
        setStatus('Attack alarm dismissed.');
      });
      document.body.append(button);
      return button;
    };

    const ringForAttack = (attack) => {
      ringingAttackIds.add(attack.id);
      ensureStopButton();
      collectAlarmController?.startAttack();
      setStatus(`Alarm: incoming attack from ${attack.attackerName}.`);
    };

    const scheduleAttack = async (attack, generation) => {
      const settings = getAttackAlarmSettings();
      if (!(await isEligible(attack, settings)) || generation !== settingsGeneration) return;
      if (!getIncomingAttacks().has(attack.id)) return;

      const delayed = settings.delayEnabled
        && isTimeInDelayWindow(new Date(), settings.delayStart, settings.delayEnd);
      if (!delayed) {
        ringForAttack(attack);
        return;
      }

      setStatus(`Waiting 20 seconds for ${attack.attackerName}; cancelled attacks stay silent.`);
      const timeout = window.setTimeout(async () => {
        pendingAttacks.delete(attack.id);
        const currentAttack = getIncomingAttacks().get(attack.id);
        const currentSettings = getAttackAlarmSettings();
        if (
          !currentAttack
          || generation !== settingsGeneration
          || !(await isEligible(currentAttack, currentSettings))
        ) return;
        ringForAttack(currentAttack);
      }, ATTACK_ALARM.delayDuration);
      pendingAttacks.set(attack.id, timeout);
    };

    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        const attacks = getIncomingAttacks();
        const currentIds = new Set(attacks.keys());

        [...knownAttackIds].forEach((id) => {
          if (!currentIds.has(id)) knownAttackIds.delete(id);
        });
        [...pendingAttacks].forEach(([id, timeout]) => {
          if (!currentIds.has(id)) {
            window.clearTimeout(timeout);
            pendingAttacks.delete(id);
          }
        });
        [...ringingAttackIds].forEach((id) => {
          if (!currentIds.has(id)) ringingAttackIds.delete(id);
        });
        if (collectAlarmController?.isAttackRinging() && ringingAttackIds.size === 0) {
          stopAttackAlarm();
          setStatus('No eligible incoming attacks remain.');
        }

        const generation = settingsGeneration;
        const newAttacks = [...attacks.values()].filter((attack) => !knownAttackIds.has(attack.id));
        newAttacks.forEach((attack) => knownAttackIds.add(attack.id));
        if (Date.now() < startupSilenceEndsAt) return;
        await Promise.all(newAttacks.map((attack) => scheduleAttack(attack, generation)));
      } finally {
        polling = false;
      }
    };

    const applySettings = () => {
      settingsGeneration += 1;
      pendingAttacks.forEach((timeout) => window.clearTimeout(timeout));
      pendingAttacks.clear();
      knownAttackIds.clear();
      getIncomingAttacks().forEach((attack, id) => knownAttackIds.add(id));
      stopAttackAlarm();
      void poll();
    };

    window.addEventListener(ATTACK_ALARM.settingsChangedEvent, applySettings);
    window.addEventListener('storage', (event) => {
      if ([
        ATTACK_ALARM.enabledKey,
        ATTACK_ALARM.mutedPlayersKey,
        ATTACK_ALARM.minimumPointsKey,
        ATTACK_ALARM.delayEnabledKey,
        ATTACK_ALARM.delayStartKey,
        ATTACK_ALARM.delayEndKey,
      ].includes(event.key)) applySettings();
    });
    try {
      const attackEvent = window.GameEvents?.attack?.incoming;
      if (attackEvent && window.$?.Observer) {
        window.$.Observer(attackEvent).subscribe('EGELTOOLS_ATTACK_ALARM', () => void poll());
      }
    } catch (error) {
      console.debug(`[${APP.name}] could not subscribe to the incoming-attack event`, error);
    }

    getIncomingAttacks().forEach((attack, id) => knownAttackIds.add(id));
    void poll();
    window.setInterval(() => void poll(), ATTACK_ALARM.pollInterval);
  }

  let unitQueueList = [];
  let unitQueueWindow = null;

  function isPremiumFeatureActive(feature) {
    if (feature === true) return true;

    const expiresAt = Number(
      typeof feature === 'object' && feature !== null
        ? feature.expires_at ?? feature.end_time ?? feature.valid_until
        : feature,
    );
    if (!Number.isFinite(expiresAt)) {
      return Boolean(feature?.active ?? feature?.is_active);
    }

    const serverTime = Number(window.Timestamp?.now?.()) || Math.floor(Date.now() / 1000);
    return expiresAt > serverTime;
  }

  function isAdministratorActive() {
    if (document.querySelector('.curator_active, .administrator_active')) return true;

    const premiumFeatures = window.Game?.premium_features;
    return isPremiumFeatureActive(premiumFeatures?.curator)
      || isPremiumFeatureActive(premiumFeatures?.administrator);
  }

  function getQueuedUnits() {
    const unitOrders = window.MM?.getModels?.()?.UnitOrder;
    if (!unitOrders) return [];

    const units = new Map();
    Object.values(unitOrders).forEach((order) => {
      const unitId = order?.getUnitId?.();
      const count = Number(order?.getCount?.());
      if (!unitId || !Number.isFinite(count) || count <= 0) return;
      units.set(unitId, (units.get(unitId) || 0) + count);
    });

    return [...units.entries()].map(([unitId, count]) => {
      const unitData = window.GameData?.units?.[unitId] || {};
      return {
        unitId,
        count,
        isNaval: Boolean(unitData.is_naval),
        name: unitData.name_plural || unitData.name || String(unitId).replaceAll('_', ' '),
      };
    });
  }

  function refreshUnitQueue() {
    try {
      unitQueueList = getQueuedUnits();
    } catch (error) {
      unitQueueList = [];
      console.debug(`[${APP.name}] troop queue is not available`, error);
    }
    return unitQueueList;
  }

  function escapeUnitQueueText(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderUnitQueueSection(title, units, emptyText) {
    const total = units.reduce((sum, unit) => sum + unit.count, 0);
    const cards = units.length > 0
      ? units
        .toSorted((left, right) => left.name.localeCompare(right.name))
        .map((unit) => {
          const unitClass = String(unit.unitId).replace(/[^a-z0-9_-]/gi, '');
          const name = escapeUnitQueueText(unit.name);
          return `
            <div class="egeltools-unit-queue__unit">
              <div class="egeltools-unit-queue__icon unit_icon40x40 ${unitClass}"
                title="${name}" aria-hidden="true"></div>
              <div class="egeltools-unit-queue__details">
                <span class="egeltools-unit-queue__name" title="${name}">${name}</span>
                <span class="egeltools-unit-queue__count">${unit.count.toLocaleString()}</span>
              </div>
            </div>`;
        })
        .join('')
      : `<p class="egeltools-unit-queue__empty">${emptyText}</p>`;

    return `
      <section class="egeltools-unit-queue__section">
        <h3 class="egeltools-unit-queue__heading">
          <span>${title}</span>
          <span class="egeltools-unit-queue__total">${total.toLocaleString()} queued</span>
        </h3>
        <div class="egeltools-unit-queue__grid">${cards}</div>
      </section>`;
  }

  function renderUnitQueueContent(queuedUnits) {
    const landUnits = queuedUnits.filter((unit) => !unit.isNaval);
    const seaUnits = queuedUnits.filter((unit) => unit.isNaval);
    const total = queuedUnits.reduce((sum, unit) => sum + unit.count, 0);
    const types = queuedUnits.length;

    return `
      <div class="egeltools-unit-queue">
        <p class="egeltools-unit-queue__summary">
          ${total.toLocaleString()} units queued across ${types.toLocaleString()} unit ${types === 1 ? 'type' : 'types'}
        </p>
        ${renderUnitQueueSection('Land units', landUnits, 'No land units in the queue')}
        ${renderUnitQueueSection('Sea units', seaUnits, 'No sea units in the queue')}
      </div>`;
  }

  function getOpenUnitQueueWindow(windowManager, windowType) {
    if (!unitQueueWindow) return null;
    if (typeof windowManager?.getOpen !== 'function') return unitQueueWindow;

    const trackedId = unitQueueWindow.getID?.();
    const openWindows = getModelArray(windowManager.getOpen(windowType));
    const activeWindow = openWindows.find((openWindow) => (
      openWindow === unitQueueWindow
      || (trackedId != null && openWindow?.getID?.() === trackedId)
    ));
    if (activeWindow) {
      unitQueueWindow = activeWindow;
      return activeWindow;
    }

    unitQueueWindow = null;
    return null;
  }

  function openUnitQueueWindow() {
    const queuedUnits = refreshUnitQueue();
    const content = renderUnitQueueContent(queuedUnits);

    try {
      const windowManager = window.GPWindowMgr;
      const windowType = windowManager?.TYPE_DIALOG;
      if (!windowManager || windowType == null) return;

      const openWindow = getOpenUnitQueueWindow(windowManager, windowType);
      if (openWindow) {
        openWindow.setContent2?.(content);
        openWindow.toForeground?.();
        openWindow.bringToFront?.();
        openWindow.focus?.();
        return;
      }

      const createdWindow = windowManager.Create?.(
        windowType,
        'wachtrij',
      );
      unitQueueWindow = createdWindow?.setContent2
        ? createdWindow
        : windowManager.getOpenFirst?.(windowType);
      if (!unitQueueWindow) return;
      unitQueueWindow.setPosition?.(['center', 'center']);
      unitQueueWindow.setSize?.(430, 500);
      unitQueueWindow.setContent2?.(content);
    } catch (error) {
      unitQueueWindow = null;
      console.debug(`[${APP.name}] could not open the troop queue`, error);
    }
  }

  function syncUnitQueueButton() {
    UNIT_QUEUE.administratorButtonIds.forEach((buttonId) => {
      document.getElementById(buttonId)?.remove();
    });

    const existingButton = document.getElementById(UNIT_QUEUE.buttonId);
    if (!isAdministratorActive()) {
      existingButton?.remove();
      return false;
    }

    const container = document.getElementById(UNIT_QUEUE.containerId);
    if (!container) return false;
    if (existingButton?.parentElement === container) return true;
    existingButton?.remove();

    const button = document.createElement('div');
    button.id = UNIT_QUEUE.buttonId;
    button.className = 'btn_settings circle_button';
    button.tabIndex = 0;
    button.setAttribute('role', 'button');
    button.setAttribute('title', 'Units in the queue');
    button.setAttribute('aria-label', 'Show units in the queue');
    button.style.top = '140px';
    button.style.right = '110px';
    button.style.zIndex = '10000';
    button.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 20 21" aria-hidden="true"
        style="display:block;margin:6px 0 0 5px;pointer-events:none">
        <g fill="#e9d49a" stroke="#3c2b15" stroke-width="1">
          <circle cx="5" cy="6" r="2.5"></circle>
          <circle cx="12.5" cy="5" r="2.5"></circle>
          <path d="M1.5 15c.3-4 1.4-6 3.5-6s3.2 2 3.5 6z"></path>
          <path d="M8.5 15c.3-4.8 1.6-7.2 4-7.2s3.7 2.4 4 7.2z"></path>
        </g>
      </svg>`;
    button.addEventListener('click', openUnitQueueWindow);
    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openUnitQueueWindow();
    });
    container.append(button);
    return true;
  }

  function ensureUi() {
    addStyles();
    // Remove the pre-0.23 ornamental settings launcher if a live page still
    // contains it; settings now live in the bottom quick-tools dock.
    document.getElementById(APP.launcherId)?.remove();
    createSettingsWindow();
    createToolDock();
    createCelebrationFinderButton();
    createCelebrationFinderPanel();
    createTownDistanceSorterButton();
    createTownDistanceSorterPanel();
    createResourceCheckerButton();
    createResourceCheckerPanel();
    mountBdLevelPanel();
    scheduleIslandUtilityMount();
    syncUnitQueueButton();
    window.requestAnimationFrame(positionToolDock);
  }

  function init() {
    ensureUi();
    initCelebrationFinder();
    initTownDistanceSorter();
    initResourceChecker();
    initBdLevelCheck();
    initIslandUtilities();
    initCollectAlarm();
    initAttackAlarm();
    refreshUnitQueue();
    window.setInterval(refreshUnitQueue, UNIT_QUEUE.refreshInterval);

    // Grepolis and other userscripts can replace the menu tree at any time.
    // Observe the stable document root and keep a low-frequency fallback for
    // Firefox userscript managers that deliver mutations differently.
    const observer = new MutationObserver(() => {
      syncUnitQueueButton();
      scheduleIslandUtilityMount();
      window.requestAnimationFrame(positionToolDock);
      const claimWindow = getBdLevelClaimWindow();
      const bdLevelPanel = document.getElementById(BD_LEVEL_CHECK.panelId);
      if (claimWindow && bdLevelPanel?.parentElement !== claimWindow) mountBdLevelPanel();
      if (
        !document.getElementById(APP.windowId)
        || !document.getElementById(APP.toolDockId)
        || !document.getElementById(APP.toolDockSettingsButtonId)
        || !document.getElementById(CELEBRATION_FINDER.floatingButtonId)
        || !document.getElementById(CELEBRATION_FINDER.panelId)
        || !document.getElementById(TOWN_DISTANCE_SORTER.floatingButtonId)
        || !document.getElementById(TOWN_DISTANCE_SORTER.panelId)
        || !document.getElementById(RESOURCE_CHECKER.floatingButtonId)
        || !document.getElementById(RESOURCE_CHECKER.panelId)
      ) {
        ensureUi();
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    const administratorObserver = new MutationObserver(syncUnitQueueButton);
    administratorObserver.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class'],
    });
    window.addEventListener('resize', positionToolDock);
    window.setInterval(() => {
      mountBdLevelPanel();
      scheduleIslandUtilityMount();
      syncUnitQueueButton();
      positionToolDock();
      if (
        !document.getElementById(APP.windowId)
        || !document.getElementById(APP.toolDockId)
        || !document.getElementById(APP.toolDockSettingsButtonId)
        || !document.getElementById(CELEBRATION_FINDER.floatingButtonId)
        || !document.getElementById(CELEBRATION_FINDER.panelId)
        || !document.getElementById(TOWN_DISTANCE_SORTER.floatingButtonId)
        || !document.getElementById(TOWN_DISTANCE_SORTER.panelId)
        || !document.getElementById(RESOURCE_CHECKER.floatingButtonId)
        || !document.getElementById(RESOURCE_CHECKER.panelId)
      ) {
        ensureUi();
      }
    }, 2000);

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      closeSettings();
      setCelebrationFinderOpen(false);
      setTownDistanceSorterOpen(false);
      setResourceCheckerOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        init();
        console.info(`[${APP.name}] v${APP.version} initialized`);
      } catch (error) {
        console.error(`[${APP.name}] failed to initialize`, error);
      }
    }, { once: true });
  } else {
    try {
      init();
      console.info(`[${APP.name}] v${APP.version} initialized`);
    } catch (error) {
      console.error(`[${APP.name}] failed to initialize`, error);
    }
  }
})();
