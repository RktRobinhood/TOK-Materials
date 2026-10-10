/*
 * Background ambience per scene: scene art id → loop name in assets/sfx/el (amb-<name>, see
 * tools/sfx-plan.mjs). Scenes not listed use `fallback`. Played by js/core/ambience.js.
 */
(function (root) {
    'use strict';
    root.Rift.data.ambience = {
        fallback: 'valley',
        scenes: {
            'scene/title': 'title',
            'scene/map': 'valley', 'scene/map-ch2': 'town', 'scene/map-ch3': 'future', 'scene/map-ch4': 'tower',
            'scene/road-forest': 'forest', 'scene/road-gate': 'forest',
            'scene/road-bridge': 'river', 'scene/road-bridge-rocket': 'river',
            'scene/rift-pass': 'pass', 'scene/wishing-well': 'well',
            'scene/fair': 'fair', 'scene/fair-restored': 'fair', 'scene/stall-gallery': 'fair', 'scene/stall-gallery-drive': 'fair',
            'scene/stall-pattern': 'fair', 'scene/stall-witness': 'fair', 'scene/stall-witness-siege': 'fair',
            'scene/village-square': 'town', 'scene/shop': 'cosy', 'scene/granny-door': 'cosy', 'scene/burrow': 'cosy',
            'scene/bakery-ovens': 'kitchen', 'scene/campfire-kitchen': 'kitchen', 'scene/feast-hall': 'feast',
            'scene/schoolhouse': 'school', 'scene/chart-gallery': 'gallery',
            'scene/tribunal': 'court', 'scene/evidence-room': 'court', 'scene/newsstand-debate': 'town',
            'scene/oracle-chamber': 'oracle', 'scene/clock-tower': 'clock', 'scene/tower-base': 'clock',
            'scene/neon-plaza': 'future', 'scene/server-hall': 'tower', 'scene/switch-room': 'tower', 'scene/core-chamber': 'core',
            'scene/arena-l1': 'arena-l1', 'scene/arena-l2': 'arena-l2', 'scene/arena-l3': 'arena-l3', 'scene/arena-l4': 'arena-l4',
            'scene/arena': 'arena-l1', 'scene/battle-table': 'table',
        },
    };
})(typeof window !== 'undefined' ? window : globalThis);
