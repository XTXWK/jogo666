import test from 'node:test';
import assert from 'node:assert/strict';
import {movementBlocked,multiplayerCardShortcut} from '../client/src/input-policy.js';

test('multiplayer card picker keeps movement active',()=>{
 assert.equal(movementBlocked({dialogOpen:true,dialogKind:'cards',solo:false}),false);
 assert.equal(movementBlocked({dialogOpen:true,dialogKind:'cards',solo:true}),true);
 assert.equal(movementBlocked({dialogOpen:true,dialogKind:'pause',solo:false}),true);
 assert.equal(movementBlocked({paused:true,dialogOpen:false,solo:false}),true);
});

test('multiplayer card shortcuts map only 1, 2 and 3',()=>{
 const choices=['blade','speed','bark'];
 assert.equal(multiplayerCardShortcut('1',choices,false),'blade');
 assert.equal(multiplayerCardShortcut('2',choices,false),'speed');
 assert.equal(multiplayerCardShortcut('3',choices,false),'bark');
 assert.equal(multiplayerCardShortcut('4',choices,false),null);
 assert.equal(multiplayerCardShortcut('1',choices,true),null);
});
