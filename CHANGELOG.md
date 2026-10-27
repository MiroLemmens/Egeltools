# Changelog

All published EgelTools releases are preserved at <https://files.miro23.uk/egeltools/releases/>.

## 1.2.85 — 2026-10-27

- Show the number of listed towns in the Show CFs dock button and the recommended-trade count in the Party trades button, in the same compact ` · N` format as Notifications. Both counts stay visible while their panels are open, and zero is shown as a number instead of a check mark.
- Refresh the CFs count every 10 seconds while its panel is closed, and build the first Party trades snapshot in the background so its count appears before the panel is opened. Later Party trades snapshots remain user-driven.

## 1.2.84 — 2026-10-27

- Make warehouse alerts compact horizontal rows with a clickable city name, native resource icons, live stored and incoming amounts, and an inline dismiss control. Remove the redundant Go to town button.
- Use only the resource with the largest total incoming delivery for red lines, arrival alerts, selection chimes, and automatic resolution. Already-full dominant resources are no longer skipped in favor of smaller resources.
- Refresh resource amounts without replacing the city link or dismiss control, preserving focus while the inbox updates.

## 1.2.83 — 2026-10-27

- Show the total number of entries in the Notifications button, including after opening the center, using the existing compact text and colors. Show zero when empty.

## 1.2.82 — 2026-10-27

- Add a native-styled Assign here button beside each owned hero in the Council of Heroes. Reassign an available or travelling hero to the selected city with one click, using normal game travel time.
- Use the same native confirmation popup as Orpheus before unassigning a city's hero or cancelling an incoming hero. Clear the destination before assigning the requested hero, serialize transfers, and block retries after an unconfirmed request.

## 1.2.81 — 2026-10-27

- Drag the Notifications window by its header using a mouse or touch. Header buttons continue to work normally.
- Keep the moved window within the viewport when resized, reopened, or updated with new notifications; retain its position while the page stays open.

## 1.2.80 — 2026-10-27

- Remove the retired Incoming trades window, its styles, rendering state, countdown and unit-ratio helpers, and window event handlers.
- Check warehouse status directly from town stock and incoming deliveries, keeping notification-center alerts, town navigation, and chimes independent of the removed window.

## 1.2.79 — 2026-10-27

- Remove the redundant Incoming trades dock button; warehouse alerts continue through Notifications.
- Match the Notifications button to the dock’s compact size, typography, shaded colors, hover and active states, with a visible keyboard focus outline.

## 1.2.78 — 2026-10-27

- Add a shared Notifications inbox for action results, incoming attacks, farming reminders, and incoming-trade warehouse alarms.
- Group repeated messages, show unread counts, and keep the latest 50 entries for the current page session. One brief preview replaces stacked popups; full messages remain readable in the inbox.
- Show compact warehouse alerts with a Go to town action. Dismissal and automatic resolution stay synchronized with Incoming trades, without forcing its detailed window open.

## 1.2.77 — 2026-10-27

- Keep incoming trades and warehouse arrival alarms working while another city is selected by reading Grepolis’s per-town trade collections. The same complete shipment data is used by Party trades.

## 1.2.76 — 2026-10-21

- Fix spell indicators for unselected towns by reading their segmented spell collections; the native getCastedPowers method always returns the selected town’s spells. Verified against live game data.

## 1.2.75 — 2026-10-21

- Show active spell indicators for every town using each town’s own spell data, and recognize native town-list row IDs.

## 1.2.74 — 2026-10-20

- Warn before replacing a hero travelling to the Orpheus target city, and cancel that journey before assigning Orpheus.

## 1.2.73 — 2026-10-19

- Add a saved Show Orpheus toggle under Settings → Culture overview, enabled by default. Turning it off immediately removes Orpheus controls and restores the native row spacing.

## 1.2.72 — 2026-10-19

- Fix island-quest town switching leaving the quest window stale: keep native command-list placeholders attached while visually hiding them, so Grepolis can complete its town-switch refresh.

## 1.2.71 — 2026-10-19

- Filter Town distances strictly above the available trade capacity threshold. Move the threshold into Settings → Town distances and add a themed sliding toggle in the title bar.

## 1.2.70 — 2026-10-19

- Add a saved Town distances toggle to show only towns with available trade capacity strictly below a configurable threshold (default 5,000). Set the threshold beside the toggle; towns with unknown capacity are excluded when filtering.

## 1.2.69 — 2026-10-19

- Align movement controls with the native attack-window actions using a shared wrapping layout and automatic container height. Use consistent button heights and reserve space for the Zapper ON label to prevent layout shifts.

## 1.2.68 — 2026-10-19

- Add a saved Settings → Attack movements toggle for removing non-cancellable movements, enabled by default. Switching it off restores automatically removed rows immediately; Zapper controls remain available in both modes.

## 1.2.67 — 2026-10-19

- Remove non-cancellable movement rows from the DOM. Add K cancellation, single-row Zapper, confirmed Zap All, and restoration on list close or Restore.
- Align compact EgelTools-styled movement controls in a wrapping attack-window row, with matching confirmation buttons.

## 1.2.66 — 2026-10-19

- Left-align the F2/siege timing row with the travel details and use a compact 24-hour date/time to fit beside the Sent units panel. Move the base-duration detail to the tooltip and allow wrapping in narrower windows.

## 1.2.65 — 2026-10-19

- Automatically detect revolt or siege from the native world's command version. Remove the conquest-system selector and ignore previously saved modes. Wait for world configuration when the mechanic is unavailable.

## 1.2.64 — 2026-10-19

- Show the projected siege end only when a colony ship is selected, assuming it lands successfully. Hide the base-duration detail in siege mode and allow the siege estimate without Helena; apply her bonus when she is present.

## 1.2.63 — 2026-10-19

- Detect Helena's base F2/siege duration automatically from native world settings, with `Game.game_speed` as a fallback. Remove manual duration entry and ignore old saved duration values; retain the selected F2/siege mode.

## 1.2.62 — 2026-10-19

- Show Helena’s projected F2 start or siege end in the attack screen using native unit travel time and her level bonus. Set the world’s base duration in hours once per conquest mode; the preference is saved per world. Times are labelled as local time and assume a successful attack with Helena accompanying it.

## 1.2.61 — 2026-10-19

- Change the late-arrival Orpheus overlay from yellow to orange for clearer visibility.

## 1.2.60 — 2026-10-19

- Overlay incoming Orpheus with transparent green when he reaches his destination by the next city party, or yellow when he arrives late. A city with no active party is ready now, so an incoming Orpheus is late.

## 1.2.59 — 2026-10-18

- Match the farm village trade button to the other Party trades buttons, including hover and disabled styling.

## 1.2.58 — 2026-10-18

- Avoid repeated idle alarm audio resets and prevent overlapping audio warm-ups during rapid clicks or key presses.

## 1.2.57 — 2026-10-17

- Hide towns with no available celebration actions from Available celebrations, including towns whose eligible celebrations are already running.

## 1.2.56 — 2026-10-17

- Remove Orpheus controls from the Available celebrations panel. Orpheus remains available in the native culture overview.

## 1.2.55 — 2026-10-17

- Scale forecast Villagers’ Loyalty resource rewards by world speed in Party trades, keeping the 13-minute collection assumption.

## 1.2.54 — 2026-10-17

- Add optional farm village exchanges to Party trades, with ratios strictly above 0.8, celebration reserves, warehouse room, and merchant-capacity checks. Revalidate each exchange before sending.

## 1.2.53 — 2026-10-17

- Add Settings → Party trades → Exclude theaters to omit theater costs from trade recommendations and donor reserves.

## 1.2.52 — 2026-10-17

- Add spell icons immediately after the native town list renders, using the same render hook as DIO hero indicators. Observe replacement lists as a fallback.

## 1.2.51 — 2026-10-17

- Correct Population Growth, Narcissism, and City Protection identifiers to use native Grepolis spell artwork.

## 1.2.50 — 2026-10-17

- Show active Call of the Ocean, Population Growth, Spartan Training, Narcim, and City Protection icons in the town selector, alongside DIO hero indicators. Refresh spell status every second.

## 1.2.49 — 2026-10-17

- Allow redirecting travelling Orpheus by cancelling his trip before transferring. Use the native Grepolis confirmation dialog when replacing a city hero.

## 1.2.48 — 2026-10-17

- Unassign Orpheus before transferring him, confirm replacement of destination heroes, and wait for each game request before proceeding. Assign to the clicked destination explicitly.

## 1.2.47 — 2026-10-17

- Compact culture controls into a native Orpheus icon with inline presence/arrival status and detailed tooltips.

## 1.2.46 — 2026-10-17

- Place Orpheus controls inside the native culture cards with matching parchment styling and consistent card heights. Update status in place to preserve scrolling and focus.

## 1.2.45 — 2026-10-17

- Mount Orpheus status and controls in the native Administrator culture overview city rows, refreshing as the overview opens and updates.

## 1.2.44 — 2026-10-17

- Show all cities in the culture overview with Orpheus presence, incoming arrival timing, and guarded per-city transfer controls. Hero transfers still require live game verification.

## 1.2.43 — 2026-10-17

- Switch the looping BD claim alarm from MP3 to PCM WAV to reduce audio decoding overhead while ringing.

## 1.2.42 — 2026-10-03

- Allow changing the Party trades time window by clicking its minute value. Default to 90 minutes, save the preference, and refresh recommendations when applied.

## 1.2.41 — 2026-09-26

- Clear Incoming trades warehouse alarms automatically once the town has room again (for example after queueing units or buildings), so the tracker no longer stays red until a page reload. Alarms tolerate stock updates that lag the arrival, and expire after 10 seconds for towns that never actually filled.

## 1.2.40 — 2026-09-14

- Fix permanent pending locks introduced in 1.2.39 by accepting successful callbacks without requiring a success flag or trade ID, while continuing to reject explicit errors.
- Reconcile requests with newly observed matching trade models when callbacks are lost.
- Show Waiting on proposals sharing a busy donor or destination and unlock them automatically after synchronization, without repeated pending-trade error banners or rebuilding the snapshot.

## 1.2.39 — 2026-09-14

- Validate proposed trades against live towns, resources, merchants, trade locks, receiver storage, and all loaded inbound deliveries before sending. Reject malformed payloads and disable unavailable proposals.
- Account for inbound shipments when allocating receiver space; preserve shortages that cannot fit and stop proposing trades when storage or the trade service is unknown.
- Serialize requests sharing a donor or destination. Keep uncertain requests blocked across Refresh and reconcile definitive late responses instead of permitting duplicate sends.

## 1.2.38 — 2026-09-12

- Fix missing incoming trades for the selected town: Grepolis Trade.isReturning() identifies deliveries to that town, not empty returning merchants. Keep resource-bearing deliveries in both the tracker and Party trades forecasts.
- Integrate warehouse notifications into the live tracker with red alarm cards, a red header and dock alarm count, automatic opening on a new alarm, and per-town dismissal.
- Keep alarm towns visible after the last delivery, and prioritize them above other receiving towns.

## 1.2.37 — 2026-09-12

- Make Incoming trades a compact 480 px floating window with readable town cards, grouped warehouse and incoming resources, and unit-ratio icons.
- Keep the header draggable, scroll long town lists inside the window, and keep its position within the viewport when reopened or resized.

## 1.2.36 — 2026-09-12

- Add a movable Incoming trades overview with live warehouse stock, next arrival, shipment counts, resource totals and matching unit-ratio icons for every receiving town.
- Sound the warehouse chime on selecting an alerted town, including native town switches, without repeating while the town stays selected.
- Place warehouse notifications above the quick-tools dock so the menu remains accessible.

## 1.2.35 — 2026-09-12

- Notify once when an incoming trade reaches the warehouse red line, with a short chime and a clickable bottom-left town card showing live storage and time until the next incoming trade.
- Share the red-line calculation between the toolbar marker and the all-town arrival monitor.

## 1.2.34 — 2026-09-11

- Share donor resources and trader capacity across the entire Party trades plan to prevent overbooking a city across destinations.
- Check current stock and available traders before sending, and prevent overlapping requests from the same city while its previous trade is processing.
- Recover from missing trade responses after 30 seconds with a Check trades status; confirmed failures remain retryable.

## 1.2.33 — 2026-09-10

- Added theater performances to Party trades, including eligibility, resource forecasts, and donor reserves shared with city parties.
- Prioritized underfunded idle celebrations, with shorter required donor routes first, ahead of running celebrations ending within 90 minutes.

## 1.2.32 — 2026-09-06

- Fixed the troop-queue window jumping when dragging starts by clearing its centering transform while preserving its visible position.

## 1.2.31 — 2026-09-05

- Fixed the unit queue failing to render after Party trades snapshot guards accidentally reached its renderer.

## 1.2.30 — 2026-09-05

- Allow sending the displayed Party trades even when outdated, without recalculating on send. Calculate only on opening or Refresh; show inline send status and allow retrying failed requests.

## 1.2.29 — 2026-09-05

- Prioritized shorter routes in Party trades before deficit coverage, preserving the 500-per-resource minimum, reserves, capacity limits, and refresh-only snapshot.

- Compacted Party trades into aligned rows and kept the displayed plan stable until Refresh, with live safety checks and inline trade status.

## 1.2.28 — 2026-09-05

- Adapted the collection timer to the selected time option, always using its Villagers' Loyalty duration.

## 1.2.27 — 2026-09-03

- Replaced the Town distances coordinate column with a **Trade** button that opens Grepolis trading for the target town without changing the selected town.

## 1.2.26 — 2026-09-02

- Optimized Party trades for arrival time by preferring shorter routes after complete deficit coverage, before using partial resource coverage to break remaining ties.

## 1.2.25 — 2026-09-02

- Kept population as the troop queue's overall headline, restored unit counts on the individual cards and land/sea subtotals, and added each card's population as a smaller `pop` value.

## 1.2.24 — 2026-09-02

- Changed the troop queue from unit counts to queued population totals, using each unit type's Grepolis population cost for the cards, sections, and overall summary.

## 1.2.23 — 2026-09-02

- Opened the troop-queue window in the center of the viewport while keeping it draggable.

## 1.2.22 — 2026-09-02

- Restyled the troop-queue window to match the other movable EgelTools parchment panels, including the shared dark header, refresh control, and close control.

## 1.2.21 — 2026-09-02

- Stopped the Barracks and Docks combined-unit totals from refreshing automatically inside an open window while retaining explicit refreshes through the existing DIO/GRCRT refresh button.

## 1.2.20 — 2026-09-02

- Matched the successfully tested **Store 3k** request exactly by sending `iron_to_keep`, `iron_to_store`, and `town_group_id: -1` without a `town_id`, so the active city does not interfere with the all-towns scope.

## 1.2.19 — 2026-09-02

- Kept **Store 3k** entirely request-scoped: it sends `town_group_id: -1` to Grepolis without changing the selected city group, while retaining the callback timeout that prevents the button from hanging.

## 1.2.18 — 2026-09-02

- Fixed **Store 3k** while a city group is selected by temporarily activating **All towns** (`-1`) for the native request, retaining `town_group_id: -1` in its payload, and restoring the original group afterward.
- Prevented an interrupted Grepolis callback from leaving **Store 3k** stuck on **Storing…**.

## 1.2.17 — 2026-09-01

- Confirmed that Grepolis keeps the bulk culture scope outside the request payload. Celebration **start all** actions now require **All towns** to be selected and show a red warning without sending when a town group is active.
- Prevented a DIO-TOOLS culture-control exception from leaving EgelTools bulk celebration buttons stuck on **Starting…** when Grepolis's callback chain is interrupted.
- Kept **Store 3k** on its verified single native request with **All towns** (`town_group_id: -1`).

## 1.2.16 — 2026-09-01

- Moved the Barracks and Docks unit grid down to reserve visible space for the combined totals, and restyled those totals to match Grepolis's native parchment UI.

## 1.2.15 — 2026-09-01

- Added town-local unit totals above buildable Barracks and Docks units, combining present units, units outside the town, and the remaining recruitment queue.

## 1.2.14 — 2026-09-01

- Kept the warehouse red line after a filling trade only when that trade overfills the live Grepolis capacity by at most 2,000 resources; larger overfills now put the line before the trade.

## 1.2.13 — 2026-09-01

- Made every celebration **start all** action and **Store 3k** pass **All towns** (`town_group_id: -1`) directly in the native request without switching the selected city group.

## 1.2.12 — 2026-08-30

- Made **Store 3k** submit with the **All towns** group (`-1`), then restore the previously selected group.

## 1.2.11 — 2026-08-30

- Kept **Collect** clear of the `+resources` amount and moved the **Collect / Store 3k** pair to the right.

## 1.2.10 — 2026-08-29

- Accounted for Grepolis's absolute `#fto_claim_button` anchor by moving **Collect** left and placing **Store 3k** in its former position.

## 1.2.9 — 2026-08-29

- Mirrored Grepolis's ID-specific **Collect** button float so **Store 3k** actually renders immediately to its right in the live farming overview.

## 1.2.8 — 2026-08-29

- Kept the **Store 3k** button visually to the right of **Collect** across farming-village layout variants.

## 1.2.7 — 2026-08-29

- Reduced background work by targeting and throttling DOM maintenance instead of rescanning all towns and farming villages after unrelated page mutations.
- Indexed Grepolis trade models once per warehouse-marker refresh instead of walking the full model graph separately for every visible trade.

## 1.2.6 — 2026-08-29

- Included underfunded city-party-capable towns with no active party in Party trades and protected their next-party resources when selecting donors.

## 1.2.5 — 2026-08-28

- Changed every celebration “start all” control to use one native Administrator overview request after selecting the **All towns** group, instead of sending a request for each city.

## 1.2.4 — 2026-08-28

- Moved Tampermonkey checks to the permanent cache-safe `?channel=stable` endpoint so new deployments are visible immediately through Cloudflare.

## 1.2.3 — 2026-08-28

- Enforced a 500-resource minimum for every non-zero resource in a recommended trade.
- Improved donor allocation so it closes small deficits with a useful shipment and avoids leaving sub-500 fragments for a follow-up trade.
- Re-ranked capacity-limited proposals to prefer donors that complete deficits cleanly.

## 1.2.2 — 2026-08-28

- Rebuilt the Party trades window with a resilient two-column card layout that keeps names, resources, distances, and actions from colliding.
- Constrained the window to the viewport and made its body independently scrollable.
- Preserved scroll position and focused trade controls across automatic refreshes.

## 1.2.1 — 2026-08-28

- Added Tampermonkey automatic-update metadata using the stable hosted script URL.
- Added versioned release publishing and hosted release history.

## 1.2.0 — 2026-08-28

- Preserved the existing EgelTools build as the release-history baseline.
