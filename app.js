const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Get Players API

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT 
           player_id AS playerId,
           player_name AS playerName
        FROM
           player_details;`;
  const players = await db.all(getPlayersQuery);
  response.send(players);
});

// Get Player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT
           player_id AS playerId,
           player_name AS playerName
        FROM
           player_details
        WHERE 
           player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

// Update Player Details API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerDetailsQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE 
            player_id = ${playerId};`;

  await db.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

// Get Match Details API

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `
        SELECT
           match_id AS matchId,
           match,
           year
        FROM 
           match_details
        WHERE
           match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(matchDetails);
});

const convertMatchDetailsObjectToResponseObject = (eachMatch) => {
  return {
    matchId: eachMatch.match_id,
    match: eachMatch.match,
    year: eachMatch.year,
  };
};

// Get Match Details With PlayerId API

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
        SELECT 
           *
        FROM player_match_score
           NATURAL JOIN match_details
        WHERE
           player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsObjectToResponseObject(eachMatch)
    )
  );
});

// Get Players Of Specific Match API

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `
        SELECT 
           player_id AS playerId,
           player_name AS playerName
        FROM player_match_score
           NATURAL JOIN player_details
        WHERE
           match_id = ${matchId};`;
  const playerDetails = await db.all(getPlayerDetailsQuery);
  response.send(playerDetails);
});

// Get Stats Of Player API

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
        SELECT
           player_id AS playerId,
           player_name AS playerName,
           SUM(score) AS totalScore,
           SUM(fours) AS totalFours,
           SUM(sixes) AS totalSixes
        FROM player_match_score
           NATURAL JOIN player_details
        WHERE
           player_id = ${playerId};`;
  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

module.exports = app;
