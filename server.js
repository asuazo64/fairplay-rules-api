const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5-20251001";

// ── Logging ────────────────────────────────────────────────────────────────
const logs = [];
function addLog(type, data) {
  logs.unshift({ ts: new Date().toISOString(), type, data });
  if (logs.length > 200) logs.pop();
}

// ── Helper: llamada a Claude ──────────────────────────────────────────────
async function callClaude(system, userContent, maxTokens = 1400) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: system,
    messages: [{ role: "user", content: userContent }],
  });
  return response.content[0].text;
}

// ── Helper: limpiar JSON de Claude ────────────────────────────────────────
function cleanJSON(raw) {
  return raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

// ══════════════════════════════════════════════════════════════════════════
// GOLF RULES KNOWLEDGE BASE 2023
// ══════════════════════════════════════════════════════════════════════════
const GOLF_KB = `GOLF RULES KNOWLEDGE BASE 2023
Source: Official Rules of Golf R&A/USGA 2023 + Official Guide USGA/AGPR
Language: English rules + Spanish interpretations (AGPR = Asociación de Golf de Puerto Rico)


============================================================
RULE 1
============================================================
Rule 1

RULE

1

The Game, Player Conduct
and the Rules

Purpose of Rule:
Rule 1 introduces these central principles of the game for the player:
• Play the course as you find it and play the ball as it lies.
• Play by the Rules and in the spirit of the game.
• You are responsible for applying your own penalties if you breach a Rule, so
that you cannot gain any potential advantage over your opponent in match play
or other players in stroke play.

1.1

The Game of Golf

Golf is played in a round of 18 (or fewer) holes on a course by striking a ball
with a club.
Each hole starts with a stroke from the teeing area and ends when the ball is holed
on the putting green (or when the Rules otherwise say the hole is completed).
For each stroke, the player:
• Plays the course as they find it, and
• Plays the ball as it lies.
But there are exceptions where the Rules allow the player to alter conditi

-- OFFICIAL INTERPRETATIONS --

1.2a/1 – Determinando si el Jugador Ha Cometido una Falta Grave de
Conducta . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . 29
1.2b(1)/1 - Desca

1.3c/1 – Un Jugador No es Descalificado de una Competencia
Cuando Esa Ronda No Cuenta . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 32

1.3c/2 – Aplicando Penalidades de Descalificación, Concesiones y
Número Incorrecto de Golpes en un Desempate de Stroke Play . . . 32
1.3c(1)/1 - Acción de Otra Persona Infringe una Regla para el Jugador . . . 33
1.3

1.2a/1 – Determinando si el Jugador Ha Cometido una Falta
Grave de Conducta
Para determinar si un jugador ha cometido una falta grave de conducta,
el Comité debe considerar todas las circunstancias. Aunque el

============================================================
RULE 2
============================================================
Rule 2

RULE

2

The Course

Purpose of Rule:
Rule 2 introduces the basic things every player should know about the course:
• There are five defined areas of the course, and
• There are several types of defined objects and conditions that can
interfere with play.
It is important to know the area of the course where the ball lies and the status
of any interfering objects and conditions, because they often affect the player’s
options for playing the ball or taking relief.

2.1

Course Boundaries and Out of Bounds

Golf is played on a course whose boundaries are set by the Committee. Areas not on
the course are out of bounds.

2.2

Defined Areas of the Course

There are five areas of the course.

2.2a The General Area
The general area covers the entire course except for the four specific areas of the
course described in Rule 2.2b.
It is called the “general area” because:
• It covers most of

============================================================
RULE 3
============================================================
Rule 3

RULE

3

The Competition

Purpose of Rule:
Rule 3 covers the three central elements of all golf competitions:
• Playing either match play or stroke play,
• Playing either as an individual or with a partner as part of a side, and
• Scoring either by gross scores (no handicap strokes applied) or net scores
(handicap strokes applied).

3.1

Central Elements of Every Competition

3.1a Form of Play: Match Play or Stroke Play
(1) Match Play or Regular Stroke Play. These are very different forms of play:
• In match play (see Rule 3.2), a player and an opponent compete against each
other based on holes won, lost or tied.
• In the regular form of stroke play (see Rule 3.3), all players compete with
one another based on the total score – that is, adding up each player’s total
number of strokes (including strokes made and penalty strokes) on each hole
in all rounds.
Most of the Rules apply 

-- OFFICIAL INTERPRETATIONS --

3.3b/1 – Jugadores Deben estar Acompañados por un Anotador
Durante Toda la Ronda . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ... . . 54

3.3b/2 – Información Puesta en Ubicación Equivocada en Tarjeta de
Score Aun Puede Ser Aceptable . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 54

4

Contenidos

3.3b/3 – Otra Tarjeta de Score Puede Ser Usada si la Oficial Está
Dañada o Perdida . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 55
3.3b(2)/1 – Los Jugadore

3.3b/1 – Jugadores Deben estar Acompañados por un
Anotador Durante Toda la Ronda
El objetivo de un anotador es certificar que el score del jugador para cada
hoyo es mostrado correctamente en la tarjet

============================================================
RULE 4
============================================================
Rule 4

RULE

4

The Player’s Equipment

Purpose of Rule:
Rule 4 covers the equipment that players may use during a round. Based on the
principle that golf is a challenging game in which success should depend on the
player’s judgment, skills and abilities, the player:
• Must use conforming clubs and balls,
• Is limited to no more than 14 clubs, and
• Is restricted in the use of other equipment that gives artificial help to their play.
For detailed requirements for clubs, balls and other equipment and the process
for consultation and submission of equipment for conformity review, see the
Equipment Rules.

4.1

Clubs

4.1a Clubs Allowed in Making a Stroke
(1) Conforming Clubs. In making a stroke, a player must use a club that conforms to
the requirements in the Equipment Rules when:
• It is new, or
• Its playing characteristics have been changed in any way (but see Rule 4.1a(2)
when a club

-- OFFICIAL INTERPRETATIONS --

4.1b/1 – Como Aplicar la Penalidad Ajustando el Resultado del
Match Una Vez que Cualquier Jugador Inició un Hoyo Durante un Match . .70
4.1b(1)/1 – Palos Llevados para el Jugador Cuentan Para el Límite
de 14 Palo

4.3a/1 – Limitación en Uso de Materiales de Lectura de Green . . . . . . . . . . . 72
4.3a/2 – Cuando el Uso de un Dispositivo de Alineación Resulta en
Infracción . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

4.1b/1 – Como Aplicar la Penalidad Ajustando el Resultado del
Match Una Vez que Cualquier Jugador Ha Iniciado un Hoyo
del Match
Si cualquier jugador en un match ha comenzado el juego de un hoyo
cuando se descubre

4.3a/1 – Limitaciones en el Uso de los Materiales de Lectura
de Greenes
La Regla 4.3 limita el uso del equipo y dispositivos que puedan ayudar a
un jugador en su juego, basándose en el principio de que el golf e

============================================================
RULE 5
============================================================
Rule 5

RULE

5

Playing the Round

Purpose of Rule:
Rule 5 covers how to play a round – such as where and when a player may practise
on the course before or during a round, when a round starts and ends and what
happens when play has to stop or resume. Players are expected to:
• Start each round on time, and
• Play continuously and at a prompt pace during each hole until the round
is completed.
When it is a player’s turn to play, it is recommended that they make the stroke in no
more than 40 seconds, and usually more quickly than that.

5.1

Meaning of Round

A “round” is 18 or fewer holes played in the order set by the Committee.
When a round ends in a tie and play will go on until there is a winner:
• Tied Match Extended One Hole at a Time. This is the continuation of the same
round, not a new round.
• Play-off in Stroke Play. This is a new round.
A player is playing their round from w

-- OFFICIAL INTERPRETATIONS --

5.2/1 – Significado de Campo en la Regla 5.2 . . . . . . . . . . . . . . . . . . . . . . . . . . .. 86
5.2b/1 – Significado de “Terminar el Juego de Su Ronda Final para
Ese Dia” en Stroke Play . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 

5.2b/2 – Practicar el Campo Puede Estar Permitido Antes de Una
Ronda en una Competencia de Días Consecutivos . . . . . . . . . . . . . . . . . . . . . . ..87

5.3a/1 – Circunstancias Excepcionales Que Justifican Dejar sin
Efecto la Penalidad por No Comenzar en Horario . . . . . . . . . . . . . . . . . . . . . . ..87

5.3a/2 – Significado de “Lugar de Comienzo” . . . . . . . . . . . . . . . . . . . . . . . . . . . ..88
5.3a/3 – Significado de “Preparado para Jugar”. . . . . . . . . . . . . . . . . . . . . . . . . ..88

============================================================
RULE 6
============================================================
Rule 6

RULE

6

Playing a Hole

Purpose of Rule:
Rule 6 covers how to play a hole – such as the specific Rules for teeing off to
start a hole, the requirement to use the same ball for an entire hole except when
substitution is allowed, the order of play (which matters more in match play than
stroke play) and completing a hole.

6.1

Starting Play of a Hole

6.1a When Hole Starts
A player has started a hole when they make a stroke to begin the hole.
The hole has started even if the stroke was made from outside the teeing area (see
Rule 6.1b) or the stroke was cancelled under a Rule.

6.1b Ball Must Be Played from Inside Teeing Area
A player must start each hole by playing a ball from anywhere inside the teeing area
under Rule 6.2b.
If a player who is starting a hole plays a ball from outside the teeing area (including
from a wrong set of tee-markers for a different teeing location on the

-- OFFICIAL INTERPRETATIONS --

6.3a/1 – Qué Hacer Cuando las Bolas se Intercambian en Lugar
Desconocido . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..106
6.3c(1)/1 – Sign

6.4c/1 – Golpe No Puede ser Cancelado Cuando se Jugó Bola
Provisional Fuera de Turno desde el Área de Salida . . . . . . . . . . . . . . . . . . . . . .. 107

6.5/1 – Cuando un Jugador o Bando ha Completado un Hoyo . . . . . . . . . . . .. 108
7

Contenidos
III

Jugando la Bola (Reglas 7–11)

Regla 7 - Búsqueda de la Bola: Encontrando e Identificando
la Bola . . . . . . . . . . . . . . . . 

6.3a/1 – Qué Hacer Cuando las Bolas se Intercambian en
Lugar Desconocido
Si, luego de embocar, dos jugadores descubren que terminaron el hoyo
con la bola del otro, pero no pueden establecer si fueron inter

============================================================
RULE 7
============================================================
Rule 7

RULE

7

Ball Search: Finding and
Identifying Ball

Purpose of Rule:
Rule 7 allows the player to take reasonable actions to fairly search for their ball in
play after each stroke.
• But the player still must be careful, as a penalty will apply if the player
acts excessively and causes improvement to the conditions affecting their
next stroke.
• The player gets no penalty if the ball is accidentally moved in trying to find or
identify it, but must then replace the ball on its original spot.

7.1

How to Fairly Search for Ball

7.1a Player May Take Reasonable Actions to Find and Identify Ball
A player is responsible for finding their ball in play after each stroke.
The player may fairly search for the ball by taking reasonable actions to find and
identify it, such as:
• Moving sand and water, and
• Moving or bending grass, bushes, tree branches and other growing or attached
natural

-- OFFICIAL INTERPRETATIONS --

7.1a/1 – Ejemplos de Acciones que Probablemente No Sean Parte de
una Búsqueda Razonable . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 113

7.2/1 – Identificando Bola Que No Puede ser Recuperada . . . . . . . . . . . . . .. 113
7.4/1 – Estimando Posición Original Donde Recolocar una Bola Movida
Durante la Búsqueda . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 

7.4/2 – Significado de “Tratando de Encontrar” . . . . . . . . . . . . . . . . . . . . . . . .. 114
7.4/3 – Bola Movida Cuando la Búsqueda se Detuvo Temporalmente . . . .. 114

Regla 8 - El Campo se Juega Como se Encuentra . . . . . . . . . . . . . .

7.1a/1 – Ejemplos de Acciones que Probablemente No Sean
Parte de una Búsqueda Razonable
Ejemplos de acciones que probablemente no sean consideradas como
parte de una búsqueda razonable, y resultarían en pen

============================================================
RULE 8
============================================================
Rule 8

RULE

8

Course Played as It Is Found

Purpose of Rule:
Rule 8 covers a central principle of the game: “play the course as you find it”.
When the player’s ball comes to rest, they normally have to accept the conditions
affecting the stroke and not improve them before playing the ball. However, a
player may take certain reasonable actions even if they improve those conditions,
and there are limited circumstances where conditions may be restored without
penalty after they have been improved or worsened.

8.1

Player’s Actions That Improve Conditions Affecting the Stroke

To support the principle of “play the course as you find it”, this Rule restricts what
a player may do to improve any of these protected “conditions affecting the stroke”
(anywhere on or off the course) for the next stroke the player will make:
• The lie of the player’s ball at rest,
• The area of the player’s inte

-- OFFICIAL INTERPRETATIONS --

8.1a/1 – Ejemplos de Acciones Que Probablemente Creen una
Potencial Ventaja . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..123

8.1a/2 – Ejemplos de Acciones Que Improbablemente Creen una
Potencial Ventaja . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..123

8.1a/3 – Jugador Que Mejora Condiciones para el Golpe a Intentar
Está en Infracción Aun Si Luego Hace un Golpe Diferente . . . . . . . . . . . . . .. 124

8.1a/4 – Ejemplo de Mover, Doblar o Romper una Obstrucción
Inamovible . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 124
8

Contenidos

============================================================
RULE 9
============================================================
Rule 9

RULE

9

Ball Played as It Lies; Ball
at Rest Lifted or Moved

Purpose of Rule:
Rule 9 covers a central principle of the game: “play the ball as it lies”.
• If the player’s ball comes to rest and is then moved by natural forces such as
wind or water, the player normally must play it from its new spot.
• If a ball at rest is lifted or moved by anyone or any outside influence before the
stroke is made, the ball must be replaced on its original spot.
• Players should take care when near any ball at rest, and a player who causes
their own ball or an opponent’s ball to move will normally get a penalty (except
on the putting green).
Rule 9 applies to a ball in play at rest on the course, and applies both during a round
and while play is stopped under Rule 5.7a.

9.1

Ball Played as It Lies

9.1a Playing Ball from Where It Came to Rest
A player’s ball at rest on the course must be played as it lies, except when the Rules
require or allow the player:
• To play a ball from another place on the course, or
• To lift a ball and then replace it on its original spot.

9.1b What to Do When Ball Moves During Backswing or Stroke
If a player’s ball at rest begins moving after the player has begun the stroke or the
backswing for a stroke and the player goes on to make the stroke:
• The ball must not be replaced, no matter what caused it to move.
• Instead, the player must play the ball from where it comes to rest after the stroke.
• If the player caused the ball to move, see Rule 9.4b to find out if there is a penalty.
Penalty for Playing Ball from a Wrong Place in Breach of Rule 9.1: General Penalty
Under Rule 14.7a.

79

Rule 9

9.2

Deciding Whether Ball Moved and What Caused It to Move

9.2a Deciding Whether Ball Moved
A player’s ball at rest is treated as having moved only if it is known or virtually certain
that it did.
If the ball might have moved but this is not known or virtually certain, it is treated as
not having moved and must be played as it lies.

9.2b Deciding What Caused Ball to Move
When a player’s ball at rest has moved:
• It must be decided what caused it to move.
• This determines whether the player must replace the ball or play it as it lies and
whether there is a penalty.
(1) Four Possible Causes. The Rules recognize only four possible causes for a ball at
rest that moves before the player makes a stroke:
• Natural forces, such as wind or water (see Rule 9.3),
• The player’s actions, including the actions of the player’s caddie (see Rule 9.4),
• The opponent’s actions in match play, including the actions of the opponent’s
caddie (see Rule 9.5), or
• An outside influence, including any other player in stroke play (see Rule 9.6).
See Rule 22.2 (in Foursomes, either partner may act for the side and action by
the partner is treated as action 

-- OFFICIAL INTERPRETATIONS --

9.2a/1 – Cuándo una Bola Es Tratada Como Movida . . . . . . . . . . . . . . . . . . 140
9.2a/2 – Jugador Responsable de Acciones que Causan que la Bola se
Mueva Aún Sin Conocimiento de que se Movió . . . . . . . . . . . . . . . . . . . . . .. 141

9.2b/1 – Determinando si las Acciones del Jugador Causaron que la
Bola se Mueva Cuando el Equipo está Involucrado . . . . . . . . . . . . . . . . . . ..141

9.4a/1 – Procedimiento Cuando la Bola del Jugador es Desalojada De
un Árbol . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 142

9.4b/1 – Bola Deliberadamente Tocada pero No Movida Resulta en
Penalidad para el Jugador . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 143

9.4b/2 – Significado de “Mientras” en la Regla 9.4b Excepción 4 . . . . . .. 144


9.4b/3 – Significado de “Acciones Razonables” en la Regla 9.4b
Excepción 4 . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 144

9.4b/4 – Jugador Levanta Bola Bajo la Regla 16.1b Que Otorga
Alivio Sin Penalidad y Luego Decide No Aliviarse . . . . . . . . . . . . . . . . . . . .. 145

9.5b/1 – Jugador Declara que la Bola Encontrada es la Suya y Eso
Causa que el Oponente Levante Otra Bola Que Era la del Jugador. . . . . .146

9.6/1 – Influencia Externa Movida por el Viento Causa que la Bola se
Mueva . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . . . . ..147

9.6/2 – Dónde Recolocar la Bola Cuando Fue Movida de una Posición
Desconocida . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . ..147

9.6/3 – Jugador se Entera que la Bola Había Sido Movida Luego de
Ejecutar el Golpe . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . .. 148

9.6/4 – Bola en Reposo Jugada y Luego se Descubre que fue Movida
por Influencia Externa La Bola Resulta Ser Bola Equivocada . .. . . . . . . . .. 148
10

Contenidos
Regla 10 - Preparando y Ejecutando un Golpe; Consejo y
Ayuda; Caddies . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 149
10.1 Ejecutando un Golpe . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 149
10.2 Consejo y Otra Ayuda . . . .

============================================================
RULE 10
============================================================
Rule 10

RULE

10

Preparing for and Making a
Stroke; Advice and Help; Caddies

Purpose of Rule:
Rule 10 covers how to prepare for and make a stroke, including advice and other
help the player may get from others (including caddies). The underlying principle
is that golf is a game of skill and personal challenge.

10.1 Making a Stroke
Purpose of Rule:
Rule 10.1 covers how to make a stroke and several acts that are prohibited in
doing so. A stroke is made by fairly striking at a ball with the head of a club. The
fundamental challenge is to direct and control the movement of the entire club by
freely swinging the club without anchoring it.

10.1a Fairly Striking the Ball
In making a stroke:
• The player must fairly strike at the ball with any part of the head of the club such
that there is only momentary contact between the club and the ball and must not
push, scrape or scoop the ball.
• I

-- OFFICIAL INTERPRETATIONS --

10.1a/1 – Ejemplos de Empujada, Arrastrada o Cuchareada . . . . . . . . . . . . . 158
10.1a/2 – Otro Material Puede Interponerse Entre la Bola y la Cabeza
del Palo Durante el Golpe . . . . . . . . . . . . . . . . . . . . . . . . . . . .

10.1b/1 – El Jugador No Debe Anclar el Palo con el Antebrazo
Contra el Cuerpo . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..159

10.1b/2 – Contacto Deliberado con la Ropa Durante el Golpe es una
Infracción . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..159

10.1b/3 – Contacto Inadvertido con la Ropa Durante el Golpe No Es
una Infracción . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..160

============================================================
RULE 11
============================================================
Rule 11

RULE

11

Ball in Motion Accidentally Hits Person,
Animal or Object; Deliberate Actions to
Affect Ball in Motion

Purpose of Rule:
Rule 11 covers what to do if the player’s ball in motion hits a person, animal,
equipment or anything else on the course. When this happens accidentally,
there is no penalty and the player normally must accept the result, whether
favourable or not, and play the ball from where it comes to rest. Rule 11 also
restricts a player from deliberately taking actions to affect where any ball in
motion might come to rest.
This Rule applies any time a ball in play is in motion (whether after a stroke or
otherwise), except when a ball has been dropped in a relief area and has not yet
come to rest. That situation is covered by Rule 14.3.

11.1

Ball in Motion Accidentally Hits Person or Outside Influence

11.1a No Penalty to Any Player
If a player’s ball in motion accidentally hits any person (including the player) or
outside influence:
• There is no penalty to any player.
• This is true even if the ball hits the player, the opponent or any other player or any
of their caddies or equipment.
Exception – Ball Played on Putting Green in Stroke Play: If the player’s ball in motion
hits another ball at rest on the putting green and both balls were on the putting
green before the stroke, the player gets the general penalty (two penalty strokes).

11.1b Place from Where Ball Must Be Played
(1) When Ball is Played from Anywhere Except on Putting Green. If a player’s ball
in motion played from anywhere except the putting green accidentally hits any
person (including the player) or outside inﬂuence (including equipment), the ball
must normally be played as it lies. But if the ball comes to rest on any person,
animal or moving outside influence, the player must not play the ball as it lies.
Instead, the player must take relief:
• When Ball Comes to Rest on Any Person, Animal or Moving Outside Influence
Located Anywhere Except on Putting Green. The player must drop the original
ball or another ball in this relief area (see Rule 14.3):
94

Rule 11

» Reference Point: The estimated point right under where the ball first came
to rest on the person, animal or moving outside influence.
» Size of Relief Area Measured from Reference Point: One club-length, but
with these limits:
» Limits on Location of Relief Area:
– Must be in the same area of the course as the reference point, and
– Must not be nearer the hole than the reference point.
• When Ball Comes to Rest on Any Person, Animal or Moving Outside Influence
Located on Putting Green. The player must place the original ball or another
ball on the estimated spot right under where the ball ﬁrst came to rest on the
person, animal or moving outside inﬂuence, using the procedures for replacing
a 

-- OFFICIAL INTERPRETATIONS --

11.1b/1 – Jugar desde Donde la Bola Fue a Reposar Cuando el Golpe
No Cuenta No Es Jugar desde un Lugar Equivocado . . . . . . . . . . . . . . . . . . . . 168

11.1b/2 – Qué Hacer Cuando la Bola se Mueve Después de Haber
Sido Desviada o Detenida Accidentalmente . . . . . . . . . . .. . . . . . . . . . . . . . . . ..169

11.1b/3 – Qué Hacer Cuando una Bola Jugada Desde Cualquier
Lugar Excepto el Green es Desviada o Levantada por un Animal . . . . . . . . ..170

11.2a/1 – Equipo Dejado en Posición Luego que el Jugador
Advierte que Podría ser una Ayuda si la Bola Fuera a Golpearlo . . . . . .. . . . .170

11.3/1 – El Resultado de las Acciones Deliberadas para Afectar a una
Bola en Movimiento Es Irrelevante . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..171

IV

Reglas Específicas para Bunkers y Green (Reglas 12–13)

Regla 12 - Bunkers . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 174
12.1 Cuándo la Bola Está en un Bunker . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 174
12.2 Jugan

11.1b/1 – Jugar desde Donde la Bola Fue a Reposar Cuando el
Golpe Debe Ser Jugado Nuevamente No Es Jugar desde un
Lugar Equivocado
Cuando a un jugador se le requiere repetir un golpe bajo una Regla y lo
hace (como bajo la Regla 11.2c(2) – Lugar desde Donde Debe Jugarse una
Bola Deliberadamente Desviada o Detenida Cuando el Golpe fue
Ejecutado Desde el Green), el golpe original no cuenta en el score del
jugador como si nunca lo hubiera jugado. Pero si el ju

11.1b/2 – Qué Hacer Cuando la Bola se Mueve Después de
Haber Sido Desviada o Detenida Accidentalmente
Si una bola va a reposar contra una persona o una influencia externa
después de haber sido desviada o detenida accidentalmente y la persona
o influencia externa se mueve o es movida, se aplica la Regla 9, y el jugador
debe seguir apropiadamente la Regla. Sin embargo, no hay penalidad bajo
la Regla 9 si la bola se mueve luego de ir a reposar contra una

11.1b/3 – Que Hacer Cuando una Bola Jugada Desde
Cualquier Lugar Excepto el Green es Desviada o Levantada
por un Animal
Si una bola jugada desde cualquier lugar excepto el green está en
movimiento y es detenida o desviada por un animal no hay penalidad y la
bola debe jugarse como reposa (ver Regla 11.1).
Pero, si un animal levanta una bola en movimiento, la bola ha ido a reposar
sobre el animal y debe tomarse alivio sin penalidad usando el punto

11.2a/1 – Equipo Dejado en Posición Luego que el Jugador
Advierte que Podría ser una Ayuda si la Bola Fuera a Golpearlo
La Regla 11.2 se aplica a una situación donde un jugador inicialmente no
posicionó el equipo, otro objeto o persona con el propósito de desviar la
bola en movimiento, pero luego de posicionado advierte que puede
desviar o detener la bola y deliberadamente lo deja allí.
Un ejemplo donde el jugador es penalizado es cuando:
• Luego de ras

11.3/1 – El Resultado de las Acciones Deliberadas para
Afectar a una Bola en Movimiento Es Irrelevante
La Regla 11.3 se aplica cuando un jugador o caddie toma una acción
deliberada con el propósito de afectar a una bola en movimiento y el
jugador infringe la Regla aunque esa acción deliberada no afecte el lugar
donde va a reposar la bola.
Ejemplos donde el jugador tiene la penalidad general bajo la Regla 11.3, y
en stroke play debe jugar la bola desde

============================================================
RULE 12
============================================================
Rule 12

RULE

12 Bunkers
Purpose of Rule:
Rule 12 is a specific Rule for bunkers, which are specially prepared areas intended
to test the player’s ability to play a ball from the sand. To make sure the player
confronts this challenge, there are some restrictions on touching the sand before
the stroke is made and on where relief may be taken for a ball in a bunker.

DIAGRAM 12.1: WHEN BALL IS IN BUNKER
Ball in bunker
Ball not in bunker

Wall or face

In line with the definition of bunker and Rule 12.1, the diagram provides examples of when a ball
is in and not in a bunker.

100

Rule 12

12.1 When Ball Is in Bunker
A ball is in a bunker when any part of the ball:
• Touches sand on the ground inside the edge of the bunker, or
• Is inside the edge of the bunker and rests:
» On ground where sand normally would be (such as where sand was blown or
washed away by wind or water), or
» In or on a loose impediment, movable obstruction, abnormal course condition
or integral object that touches sand in the bunker or is on ground where sand
normally would be.
If a ball lies on soil or grass or other growing or attached natural objects inside the
edge of the bunker without touching any sand, the ball is not in the bunker.
If part of the ball is both in a bunker and in another area of the course, see Rule 2.2c.

12.2 Playing Ball in Bunker
This Rule applies both during a round and while play is stopped under Rule 5.7a.

12.2a Removing Loose Impediments and Movable Obstructions
Before playing a ball in a bunker, a player may remove loose impediments under Rule
15.1 and movable obstructions under Rule 15.2.
This includes any reasonable touching or movement of the sand in the bunker that
happens while doing so.

12.2b Restrictions on Touching Sand in Bunker
(1) When Touching Sand Results in Penalty. Before making a stroke at a ball in a
bunker, a player must not:
• Deliberately touch sand in the bunker with a hand, club, rake or other object to
test the condition of the sand to learn information for the next stroke, or
• Touch sand in the bunker with a club:
» In the area right in front of or right behind the ball (except as allowed under
Rule 7.1a in fairly searching for a ball or under Rule 12.2a in removing a
loose impediment or movable obstruction),
» In making a practice swing, or
» In making the backswing for a stroke.
See Rule 25.2f (modification of Rule 12.2b(1) for players who are blind); Rules 25.4l
(application of Rule 12.2b(1) for players who use an assistive mobility device).
101

Rule 12

(2) When Touching Sand Does Not Result in Penalty. Except as covered by (1), this
Rule does not prohibit the player from touching sand in the bunker in any other
way, including:
• Digging in with the feet to take a stance for a practice swing or the stroke,
• Smoothing

-- OFFICIAL INTERPRETATIONS --

12.2a/1 – Mejora Resulta de Quitar Impedimentos Sueltos u
Obstrucciones Movibles en un Bunker . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 177

12.2b/1 – La Regla 12.2b se Aplica a un Montículo de Arena de un
Agujero de Animal en un Bunker . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .177

12.2b/2 – Si el Jugador Puede Sondear en un Bunker . . . . . . . . . . . . . . . . . . . . 178
12.2b/3 – La Regla 12.2 Continúa Aplicándose Cuando el Jugador Ha
Levantado su Bola de un Bunker para Aliviarse pero No Ha Decidido
Aun Si se Alivia Dentro o Fuera del Bunker . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..178
12

Contenidos
Regla 13 - Greenes . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 179
13.1 Acciones Permitidas o Requerida

12.2a/1 – Mejora Resultante de Quitar Impedimentos Sueltos
u Obstrucciones Movibles en un Bunker
Cuando se remueven impedimentos sueltos u obstrucciones movibles
de un bunker, a menudo la arena es movida al quitar el objeto, y no hay
penalidad si esto mejora las condiciones que afectan al golpe si las
acciones tomadas para remover impedimentos sueltos u obstrucciones
movibles fueron razonables (Regla 8.1b(2)).

Por ejemplo, un jugador quita una piña cerca

12.2b/1 – La Regla 12.2b se Aplica a un Montículo de Arena de
un Agujero de Animal en un Bunker
Si la bola de un jugador reposa en un bunker en o cerca de un montículo
de arena que es parte de un agujero de animal, las restricciones en la Regla
12.2b(1) se aplican al tocar ese montículo de arena.
No obstante, el jugador puede aliviarse del agujero de animal (que es una
condición anormal del campo), bajo la Regla 16.1c

177

Regla 12

12.2b/2 – Si el Jugador Puede Sondear en un Bunker
La Aclaración 8.1a/7 confirma que un jugador puede, sin penalidad,
sondear en cualquier lugar del campo (incluyendo un bunker) para
determinar si raíces de un árbol, piedras u obstrucciones pudieran
interferir con su golpe, en tanto el jugador no mejore las condiciones que
afectan al golpe.
Por ejemplo, cuando la bola de un jugador va a reposar cerca de un drenaje
dentro de un bunker, el jugador p

12.2b/3 – La Regla 12.2 Continúa Aplicándose Cuando el
Jugador Ha Levantado Su Bola de un Bunker para Aliviarse,
pero No Ha Decidido Aún Si se Alivia Dentro o Fuera del
Bunker
Si un jugador ha levantado la bola de un bunker para aliviarse de acuerdo
con una Regla, pero todavía no ha decidido qué opción de alivio utilizar, las
restricciones de la Regla 12.2b(1) continúan aplicándose.
Por ejemplo, si el golpe de salida de un jugador está injugable en un

============================================================
RULE 13
============================================================
Rule 13

RULE

13 Putting Greens
Purpose of Rule:
Rule 13 is a specific Rule for putting greens. Putting greens are specially prepared
for playing the ball along the ground and there is a flagstick for the hole on each
putting green, so certain different Rules apply than for other areas of the course.

13.1 Actions Allowed or Required on Putting Greens
Purpose of Rule:
This Rule allows the player to do things on the putting green that are normally
not allowed off the putting green, such as being allowed to mark, lift, clean and
replace a ball and to repair damage and remove sand and loose soil on the putting
green. There is no penalty for accidentally causing a ball or ball-marker to move
on the putting green.

13.1a When Ball Is on Putting Green
A ball is on the putting green when any part of the ball:
• Touches the putting green, or
• Lies on or in anything (such as a loose impediment or an obstruction) and is inside
the edge of the putting green.
If part of the ball is both on the putting green and in another area of the course,
see Rule 2.2c.

13.1b Marking, Lifting and Cleaning Ball on Putting Green
A ball on the putting green may be lifted and cleaned (see Rule 14.1).
The spot of the ball must be marked before it is lifted (see Rule 14.1) and the ball
must be replaced on its original spot (see Rule 14.2).

13.1c Improvements Allowed on Putting Green
During a round and while play is stopped under Rule 5.7a, a player may take
these two actions on the putting green, no matter whether the ball is on or off
the putting green:

103

Rule 13

(1) Removal of Sand and Loose Soil. Sand and loose soil on the putting green may
be removed without penalty.
(2) Repair of Damage. A player may repair damage on the putting green without
penalty by taking reasonable actions to restore the putting green as nearly as
possible to its original condition, but only:
• By using their hand, foot or other part of the body or a normal ball-mark repair
tool, tee, club or similar item of normal equipment, and
• Without unreasonably delaying play (see Rule 5.6a).
But if the player improves the putting green by taking actions that exceed what
is reasonable to restore the putting green to its original condition (such as by
creating a pathway to the hole or by using an object that is not allowed), the
player gets the general penalty for breach of Rule 8.1a.
“Damage on the putting green” means any damage caused by any person
(including the player) or outside inﬂuence, such as:
• Ball marks, shoe damage (such as spike marks) and scrapes or indentations
caused by equipment or a flagstick,
• Old hole plugs, turf plugs, seams of cut turf and scrapes or indentations from
maintenance tools or vehicles,
• Animal tracks or hoof indentations, and
• Embedded objects (such as a stone, acorn

-- OFFICIAL INTERPRETATIONS --

13.1e/1 – No Está Permitido Probar Deliberadamente Cualquier Green . .190
13.2a(1)/1 – Un Jugador Tiene Derecho a Dejar el Astabandera en la
Posición que la Dejó el Grupo que lo Precede . . . . . . . . . . . . . . . . . . . . . . . . . . 190
13.2a(4)/1 – Astabandera No Atendida Quitada Sin Autorización del
Jugador Puede Ser Recolocada . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 191
13.2b(1)/1 – El Jugador Puede Ejecutar un Golpe Mientr

13.3a/1 – Significado de Tiempo Razonable para el Jugador para
Llegar al Hoyo . . . . .. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..191

13.3b/1 – Qué Hacer Cuando la Bola del Jugador Sobrepasando el
Borde del Hoyo se Mueve Cuando el Jugador Quita el Astabandera . . . . .. 191

V

Levantando y Volviendo a Poner una Bola en Juego
(Regla 14)

Regla 14 - Procedimientos para la Bola: Marcando, Levantando
y Limpiando; Recolocando en un Punto; Dropeando
en Área de Alivio; Jugando Desde un Lugar Equivocado . . . 194
14.1 Marcando, Levantando y Limpiando la Bola . . . . . . . . . . . . . . . . . . . .

13.1e/1 – No Está Permitido Probar Deliberadamente
Cualquier Green
La Regla 13.1e le prohíbe a un jugador tomar dos acciones específicas en el
green o en un green equivocado con el propósito de obtener información
sobre cómo puede rodar una bola. No le prohíbe tomar otras acciones
incluso si se hacen con el propósito de probar el green, o se toman
inadvertidamente las acciones prohibidas.
Un ejemplo de una acción que es una infracción a la Regla 1

13.3a/1 – Significado de Tiempo Razonable para el Jugador
para Llegar al Hoyo
Determinar los límites de un tiempo razonable para llegar al hoyo depende
de las circunstancias del golpe e incluye el tiempo para la reacción natural
o espontánea del jugador al ver que la bola no entra al hoyo.
Por ejemplo, un jugador puede haber jugado el golpe desde bien lejos
del green y puede tomarle varios minutos el llegar al hoyo mientras otros
jugadores juegan sus gol

13.3b/1 – Qué Hacer Cuando la Bola del Jugador
Sobrepasando el Borde del Hoyo se Mueve Cuando el
Jugador Quita el Astabandera
Luego de que el astabandera es quitada por el jugador, si su bola
sobrepasando el borde del hoyo se mueve, debe proceder como sigue:

191

Regla 13
• Si es conocido o virtualmente cierto que la remoción del astabandera

por el jugador causó que la bola se mueva, la bola se recoloca en
el borde del hoyo y se aplica la R

============================================================
RULE 14
============================================================
Rule 14

RULE

14

Procedures for Ball: Marking, Lifting and
Cleaning; Replacing on Spot; Dropping in
Relief Area; Playing from Wrong Place

Purpose of Rule:
Rule 14 covers when and how the player may mark the spot of a ball at rest and
lift and clean the ball and how to put a ball back into play so that the ball is played
from the right place.
• When a lifted or moved ball is to be replaced, the same ball must be set down
on its original spot.
• When taking free relief or penalty relief, a substituted ball or the original ball
must be dropped in a particular relief area.
A mistake in using these procedures may be corrected without penalty before the
ball is played, but the player gets a penalty if they play the ball from the wrong
place.

14.1 Marking, Lifting and Cleaning Ball
This Rule applies to the deliberate “lifting” of a player’s ball at rest. This may be
done in any way, which includes picking up the ball by hand, rotating it or otherwise
deliberately causing it to move from its spot.

14.1a Spot of Ball to Be Lifted and Replaced Must Be Marked
Before lifting a ball under a Rule requiring the ball to be replaced on its original spot,
the player must mark the spot, which means to:
• Place a ball-marker right behind or right next to the ball, or
• Hold a club on the ground right behind or right next to the ball.
If the spot is marked with a ball-marker, after replacing the ball the player must
remove the ball-marker before making a stroke.
If the player lifts the ball without marking its spot, marks its spot in a wrong way or
makes a stroke with a ball-marker left in place, the player gets one penalty stroke.
When a ball is lifted to take relief under a Rule, the player is not required to mark the
spot before lifting the ball.

14.1b Who May Lift Ball
The player’s ball may be lifted under the Rules only by:
114

Rule 14

• The player, or
• Anyone the player authorizes, but such authorization must be given each time
before the ball is lifted rather than given generally for the round.
Exception – When Caddie May Lift Player’s Ball Without Authorization: The caddie
may lift the player’s ball without authorization when:
• The player’s ball is on the putting green, or
• It is reasonable to conclude (such as from an action or statement) that the player
will take relief under a Rule.
If the caddie lifts the ball when not allowed to do so, the player gets one penalty
stroke (see Rule 9.4).
See Rules 25.2g, 25.4a and 25.5d (for players with certain disabilities, Rule 14.1b
is modified to allow an aide to lift the player’s ball on the putting green without
authorization).

14.1c Cleaning Ball
A ball lifted from the putting green may always be cleaned (see Rule 13.1b).
A ball lifted from anywhere else may always be cleaned except when it is lifted:
• To 

-- OFFICIAL INTERPRETATIONS --

14.1a/1 – Marcando una Bola Correctamente . . . . . . . . . . . . . . . . . . . . . . . . . . . . 210
14.1c/1 – El Jugador Debe Ser Cuidadoso Cuando la Bola Levantada
No Debe ser Limpiada . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 211

14.1c/2 – Cuando Puede Limpiarse una Bola Movida . . . . . . . . . . . . . . . . . . . . . ..211
14.2b(2)/1 – Jugador Dropea Una Bola Cuando Debe ser Recolocada . . . . . . 211

14.2c/1 – La Bola Puede Recolocarse en Casi Cualquier Orientación . . . . . . . ..212
14.2c/2 – Remoción de Impedimento Suelto del Lugar Donde se
Recolocará la Bola . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..212

14.2c/3 – La Bola No Debe Presionarse Contra el Suelo al Recolocarla . . . . . . ..213
14.2d(2)/1 – Lie Alterado Puede Ser el “Punto Más Cercano con el
Lie Más Similar” . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..213

14.2e/1 – El Jugador Debe Aliviarse con Penalidad Cuando el
Lugar Donde Quedará la Bola en Reposo Está Más Cerca del Hoyo. . . . . . . . .. 213
14.3b(2)/1 – Bola Dropeada Desde la Altura de la Rodilla
en Área Irregular . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . ..214

14.3c/1 – Área de Alivio Incluye Cualquier Cosa Dentro de Ella . .. . . . . . . . . ..216
14.3c/2 – La Bola Puede Dropearse en una Zona de Juego Prohibido . .. . . . .. 216
14.3c(1)/1 – Qué Hacer Cuando la Bola Dropeada se Mueve
Después de Ir a Reposar Contra el Pie del Jugador o su Equipo . . . . . . . . . . . ..216
14.3c(2)/1 – Dónde Colocar una Bola Dropeada Dos Veces en
Forma Correcta en el Área de Alivio que Tiene un Arbusto . . . . . . . . . . . . . . . . . 216

14.4/1 – Bola Colocada No Está en Juego Salvo que Haya Habido
Intención de Ponerla en Juego . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 217

14.4/2 – No Están Permitidos los Dropeos de Prueba . . . . . . . . . . . . . . . . . . . . ..217
14.5b(1)/1 – El Jugador Puede Cambiar las Áreas de Alivio Cuando
Dropea Nuevamente por Alivio en Línea Hacia Atrás . . . . . . . . . . . . . . . . . . . . .. 218
14.5b(1)/2 – El Jugador Puede Cambiar Áreas del Campo en el Área
de Alivio Cuando Dropea Nuevamente . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..218

14.7b/1 – El Jugador es Penalizado por Cada Golpe Ejecutado desde
un Área Donde el Juego No Está Permitido . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..218

14.7b/2 – La Bola Está en Lugar Equivocado Si el Palo Golpea la
Condición de la que se Tomó Alivio . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..219
14

Contenidos
VI

Alivio Sin Penalidad (Reglas 15–16)

Regla 15 - Alivio de Impedimentos Sueltos y Obstrucciones
Movibles (Incluyendo Bola o Marcador de Bola
Ayudando o Interfiriendo el Juego) . . . . . . . . . . . . . . . . . . 222
15.1 Impedimentos Sueltos . . . . . . . . . . . . . 

14.1a/1 – Marcando una Bola Correctamente
La Regla 14.1a usa “inmediatamente detrás” o “justo al lado de” para
asegurar que la posición de una bola levantada es marcada con suficiente
precisión para que el jugador la recoloque en el lugar correcto.
Una bola puede ser marcada en cualquier posición alrededor de la misma
en tanto sea marcada justo al lado de ella, y esto incluye colocar un
marcador de bola justo adelante o al costado de la b

14.1c/1 – El Jugador Debe Ser Cuidadoso Cuando la Bola
Levantada No Debe ser Limpiada
Cuando un jugador está aplicando cualesquiera de las cuatro Reglas citadas
en la Regla 14.1c donde la limpieza no está permitida, hay actos que el
jugador debería evitar porque, sin perjuicio que no haya habido intención
de limpiar la bola, el acto en sí mismo puede implicar que la bola fue
limpiada.
Por ejemplo, si un jugador levanta su bola que tiene pasto u otros


============================================================
RULE 15
============================================================
Rule 15

RULE

15

Relief from Loose Impediments and Movable
Obstructions (Including Ball or Ball-Marker
Helping or Interfering with Play)

Purpose of Rule:
Rule 15 covers when and how the player may take free relief from loose
impediments and movable obstructions.
• These movable natural and artificial objects are not treated as part of the
challenge of playing the course, and a player is normally allowed to remove
them when they interfere with play.
• But the player needs to be careful in moving loose impediments near their ball
off the putting green, because there will be a penalty if moving them causes
the ball to move.

15.1 Loose Impediments
15.1a Removal of Loose Impediment
Without penalty, a player may remove a loose impediment anywhere on or off
the course, and may do so in any way (such as by using a hand or foot, using a
club or other equipment, getting help from others or breaking off part of a loose
impediment).
But there are two exceptions:
Exception 1 – Removing Loose Impediment Where Ball Must Be Replaced: Before
replacing a ball that was lifted or moved from anywhere except the putting green:
• A player must not deliberately remove a loose impediment that, if moved before
the ball was lifted or moved, would have been likely to have caused the ball to
move.
• If the player does so, they get one penalty stroke, but the removed loose
impediment does not need to be replaced.
This exception applies both during a round and while play is stopped under Rule
5.7a. It does not apply to a loose impediment that was not there before the ball was
lifted or moved or that is removed as a result of marking the spot of a ball or lifting,
moving or replacing a ball or causing a ball to move.
Exception 2 – Restrictions on Deliberately Removing Loose Impediments to Affect
Ball in Motion (see Rule 11.3).

130

Rule 15
15.1b Ball Moved When Removing Loose Impediment
If a player’s removal of a loose impediment causes their ball to move:
• The ball must be replaced on its original spot (which if not known must be
estimated) (see Rule 14.2).
• If the moved ball had been at rest anywhere except on the putting green (see Rule
13.1d) or in the teeing area (see Rule 6.2b(6)), the player gets one penalty stroke
under Rule 9.4b, except when Rule 7.4 applies (no penalty for ball moved during
search) or when another exception to Rule 9.4b applies.
Penalty for Playing Ball from a Wrong Place in Breach of Rule 15.1: General Penalty
Under Rule 14.7a.

15.2 Movable Obstructions
This Rule covers free relief that is allowed from artificial objects that meet the
definition of movable obstruction.
It does not give relief from immovable obstructions (a different type of free relief
is allowed under Rule 16.1) or boundary objects or integral objects (no free relief is
allowed)

-- OFFICIAL INTERPRETATIONS --

15.1a/1 – Remoción de Impedimentos Sueltos del Área de Alivio o
Punto Donde la Bola Será Dropeada, Colocada o Recolocada . . . . . . . . . . ..228

15.3/1 – Métodos para Mover una Bola o Marcador de Bola
Ayudando o Interfiriendo el Juego . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..229

15.3a/1 – Infracción a Regla por Dejar en su Lugar una Bola que
Ayuda No Requiere Conocimiento . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..229

15.3a/2 – En Match Play los Jugadores Están Autorizados a Dejar una
Bola que Ayuda . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . . . . . . . . . ..230

Regla 16 - Alivio de Condiciones Anormales del Campo
(Incluyendo Obstrucciones Inamovibles), Condición
de Animal Peligroso, Bola Enterrada . . . . . . . . . . . . . . . . . . . . 231
16.1 Condiciones Anormales del Campo (Incluyendo Obstrucciones
Inamovibles) . . . . . . . 

15.1a/1 – Remoción de Impedimento Suelto del Área de Alivio
o Punto Donde la Bola Será Dropeada, Colocada o Recolocada
La Excepción 1 a la Regla 15.1a deja en claro que antes de recolocar una
bola, el jugador no debe quitar un impedimento suelto que, si hubiera
sido movido cuando la bola estaba en reposo, probablemente hubiera
ocasionado que la bola se moviera. Esto es porque cuando la bola estaba
inicialmente en su lugar, el jugador hubiera tenido el ries

15.3/1 – Métodos para Mover una Bola o Marcador de Bola
que Ayuda o Interfiere el Juego
Cuando un jugador está moviendo su bola o marcador de bola bajo la Regla
15.3, debería colocarse hacia el costado midiendo con un palo, como
usando la cabeza o la longitud total del palo. Esto puede hacerse midiendo
directamente desde la bola, o marcando la posición de la bola y midiendo
desde allí.
Algunos ejemplos de esto incluyen:
• El jugador puede marcar la pos

15.3a/1 – Infracción a Regla por Dejar en su Lugar una Bola
que Ayuda No Requiere Conocimiento
En stroke play, bajo la Regla 15.3a, si dos o más jugadores acuerdan dejar
una bola en su lugar en el green para ayudar a cualquier jugador, y el golpe
es ejecutado con la bola que ayuda dejada en su lugar, cada jugador que hizo
el acuerdo tiene dos golpes de penalidad. Una infracción a la Regla 15.3a no
depende de que los jugadores sepan que tal acuerdo no está 

15.3a/2 – En Match Play los Jugadores Están Autorizados a
Dejar una Bola que Ayuda
En un match, un jugador puede acordar dejar su bola en su lugar para
ayudar a su oponente dado que el resultado de cualquier beneficio que
pueda provenir del acuerdo afecta solo el match entre ellos.

230

Regla 16

REGLA

16

Alivio de Condiciones Anormales del Campo
(Incluyendo Obstrucciones Inamovibles),
Condición de Animal Peligroso, Bola Enterrada

Propósito de la Re

============================================================
RULE 16
============================================================
Rule 16

RULE

16

Relief from Abnormal Course Conditions
(Including Immovable Obstructions),
Dangerous Animal Condition, Embedded Ball

Purpose of Rule:
Rule 16 covers when and how the player may take free relief by playing a ball
from a different place, such as when there is interference by an abnormal course
condition or a dangerous animal condition.
• These conditions are not treated as part of the challenge of playing the course,
and free relief is generally allowed except in a penalty area.
• The player normally takes relief by dropping a ball in a relief area based on the
nearest point of complete relief.
This Rule also covers free relief when a player’s ball is embedded in its own
pitch-mark in the general area.

16.1 Abnormal Course Conditions (Including Immovable
Obstructions)
This Rule covers free relief that is allowed from interference by animal holes, ground
under repair, immovable obstructions or temporary water:
• These are collectively called abnormal course conditions, but each has a separate
definition.
• This Rule does not give relief from movable obstructions (a different type of free
relief is allowed under Rule 15.2a) or boundary objects or integral objects (no free
relief is allowed).

16.1a When Relief Is Allowed
(1) Meaning of Interference by Abnormal Course Condition. Interference exists when
any one of these is true:
• The player’s ball touches or is in or on an abnormal course condition,
• An abnormal course condition physically interferes with the player’s area of
intended stance or area of intended swing, or
• Only when the ball is on the putting green, an abnormal course condition on or
off the putting green intervenes on the line of play.
If the abnormal course condition is close enough to distract the player but does
not meet any of these requirements, there is no interference under this Rule.
137

Rule 16

See Committee Procedures, Section 8; Model Local Rule F-6 (the Committee may
adopt a Local Rule denying relief from an abnormal course condition that only
interferes with the area of intended stance).

DIAGRAM 16.1a: WHEN RELIEF IS ALLOWED FOR ABNORMAL COURSE
CONDITION

P1

B1

Direction of play

Relief
area
B2

P2
Relief
area

Abnormal
course
condition
• The diagram assumes the player is right-handed.
• Free relief is allowed for interference by an abnormal course condition (ACC), including an
immovable obstruction, when the ball touches or lies in or on the condition (B1), or the
condition interferes with the area of intended stance (B2) or swing.
• The nearest point of complete relief for B1 is P1, and is very close to the condition.
• For B2, the nearest point of complete relief is P2, and is farther from the condition as the
stance has to be clear of the ACC.

138

Rule 16

(2) Relief Allowed Anywhere on Cour

-- OFFICIAL INTERPRETATIONS --

16.1/1 – Alivio de Condición Anormal del Campo Puede Resultar en
Condiciones Mejores o Peores . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..243

16.1/2 – Si Hay Interferencia por una Segunda Condición Anormal
del Campo Luego de Tomar Alivio Completo de la Primera
Condición, Se Puede Tomar Nuevo Alivio . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..243

16.1/3 – Cuando Existe Interferencia de Dos Condiciones, el Jugador
Puede Elegir Aliviarse de Cualquiera de las Dos . . . . . . . . .. . . . . . . . . . . . . . . ..244

16.1/4 – Cómo Aliviarse Cuando una Bola Reposa en la Parte
Elevada de una Obstrucción Inamovible . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..244
15

Contenidos

16.1/5 – Cómo Medir el Punto Más Cercano de Alivio Completo Cuando
una Bola Está Bajo Tierra en Obstrucción Inamovible . . . . . . . . . . . . . . . . . ..245

16.1/6 – El Jugador Puede Esperar para Determinar el Punto Más
Cercano de Alivio Completo Cuando la Bola Está Moviéndose en el Agua . .245
16.1a(3)/1 – Obstrucción Interfiriendo con un Golpe Anormal
Puede No Impedir que el Jugador Tome Alivio . . . . . . . . . . . . . . . . . . . . . . . ..246
16.1a(3)/2 – El Jugador No Puede Pretender Emplear un Golpe
Claramente Irrazonable para Estar Interferido por una Condición . . . . .. ..246
16.1a(3)/3 – Aplicación de 

16.1b/1 – Procedimiento de Alivio Cuando una Bola Reposa Bajo
Tierra en una Condición Anormal del Campo . . . . . . . . . . . . . . . . . . . . . . . . . . .247

16.1c/1 – Jugador Toma el Máximo Alivio Disponible; Luego Decide
Aliviarse en Línea Hacia Atrás . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..248

16.1c/2 – Luego de Levantar la Bola el Jugador Puede Cambiar la
Opción de Alivio Antes de Poner una Bola en Juego . . . . . . . . . . . . . . . . . . . . .248
16.3a(2)/1 – Concluyendo Si la Bola está Enterrada en Su Propio Impacto.249

16.3b/1 – Aliviándose por Bola Enterrada Cuando el Punto
Inmediatamente Detrás de la Bola No Está en el Área General . . . . . . . . . . . 249

VII Alivio Con Penalidad (Reglas 17–19)
Regla 17 - Áreas de Penalidad . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 252
17.1 Opciones para Bola en Área de Penalidad . . . . . . . . . . . . . . . . . . . . . . . . . . 252
17.2 Opciones Después de Jugar Una Bola Desde un Área de Penalidad . . .

16.1/1 – Alivio de Condición Anormal del Campo Puede
Resultar en Condiciones Mejores o Peores
Si al aliviarse conforme a la Regla 16.1, el jugador obtiene mejores
condiciones que afectan el golpe es buena suerte del jugador. Nada hay en
la Regla 16.1 que requiera que mantenga idénticas condiciones luego de
aliviarse.
Por ejemplo, al aliviarse de una boca de riego (obstrucción inamovible)
en el rough, el punto más cercano de alivio completo del jugad

16.1/2 – Si Hay Interferencia por una Segunda Condición
Anormal del Campo Luego de Tomar Alivio Completo de la
Primera Condición, Se Puede Tomar Nuevo Alivio
Si un jugador tiene interferencia por una segunda condición anormal del
campo luego de aliviarse completamente de una condición anormal del
campo, la segunda es una nueva situación y el jugador puede aliviarse
nuevamente bajo la Regla 16.1.
Por ejemplo, en el área general, hay dos áreas de agua te

============================================================
RULE 17
============================================================
Rule 17

RULE

17 Penalty Areas
Purpose of Rule:
Rule 17 is a specific Rule for penalty areas, which are bodies of water or other
areas defined by the Committee where a ball is often lost or unable to be played.
For one penalty stroke, players may use specific relief options to play a ball from
outside the penalty area.

17.1

Options for Ball in Penalty Area

Penalty areas are defined as either red or yellow. This affects the player’s relief
options (see Rule 17.1d).
A player may stand in a penalty area to play a ball outside the penalty area, including
after taking relief from the penalty area.

17.1a When Ball Is in Penalty Area
A ball is in a penalty area when any part of the ball:
• Lies on or touches the ground or anything else (such as any natural or artificial
object) inside the edge of the penalty area, or
• Is above the edge or any other part of the penalty area.
If part of the ball is both in a penalty area and in another area of the course, see
Rule 2.2c.

17.1b Player May Play Ball as It Lies in Penalty Area or Take Penalty Relief
The player may either:
• Play the ball as it lies without penalty, under the same Rules that apply to a ball in
the general area (which means there are no special Rules limiting how a ball may
be played from a penalty area), or
• Play a ball from outside the penalty area by taking penalty relief under Rule 17.1d
or 17.2.
Exception – Relief Must Be Taken from Interference by No Play Zone in Penalty Area
(see Rule 17.1e).

150

Rule 17
17.1c Relief for Ball Not Found but in Penalty Area
If a player’s ball has not been found and it is known or virtually certain that the ball
came to rest in a penalty area:
• The player may take penalty relief under Rule 17.1d or 17.2.
• Once the player puts another ball in play to take relief in this way:
» The original ball is no longer in play and must not be played.
» This is true even if it is then found on the course before the end of the threeminute search time (see Rule 6.3b).
But if it is not known or virtually certain that the ball came to rest in a penalty area
and the ball is lost, the player must take stroke-and-distance relief under Rule 18.2.

17.1d Relief for Ball in Penalty Area
If a player’s ball is in a penalty area, including when it is known or virtually certain to
be in a penalty area even though not found, the player has these relief options, each
for one penalty stroke:
(1) Stroke-and-Distance Relief. The player may play the original ball or another ball
from where the previous stroke was made (see Rule 14.6).
(2) Back-on-the-Line Relief. The player may drop the original ball or another ball
(see Rule 14.3) outside the penalty area, keeping the estimated point where
the original ball last crossed the edge of the penalty area between the hole and
the spot whe

-- OFFICIAL INTERPRETATIONS --

17.1a/1 – Bola Perdida Ya Sea en Área de Penalidad o en una
Condición Anormal del Campo Adyacente . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 262
17.1d(3)/1 – El Jugador Puede Medir A Través del Área de
Penalidad al Tomar Alivio Lateral . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 262
17.1d(3)/2 – Jugador Dropea una Bola Basado en Estimar Donde la
Bola Cruzó por Última Vez el Borde de un Área de Penalidad Que
Lue

17.2b/1 – Ejemplos de Opciones de Alivio Permitidos por la Regla . . . . . .. . 263
16

Contenidos
Regla 18 - Alivio Bajo Golpe y Distancia, Bola Perdida o Fuera
de Límites, Bola Provisional . . . . . . . . . . . . . . . . . . . . . . . . . . . . 265
18.1 El Alivio con Penalidad de Golpe y Distancia Permitido en
Cualquier Momento . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..265
18.2 Bola Perdida o Fuera de Límites: Debe Tomarse Al

17.1a/1 – Bola Perdida Ya Sea en Área de Penalidad o en
una Condición Anormal del Campo Adyacente
Si la bola de un jugador no es encontrada en un área donde hay un
área de penalidad y una condición anormal del campo adyacente, el
jugador debe emplear un juicio razonable (Regla 1.3a(2)) al determinar
la ubicación de la bola. Si, luego de aplicar dicho criterio, es conocido
o virtualmente cierto que la bola fue a reposar en una de esas
áreas, pero ambas 

17.2b/1 – Ejemplos de Opciones de Alivio Permitidos por la
Regla 17.2b
Punto por donde la bola entro
al área de penalidad
Punto de referencia

En el diagrama, un jugador juega desde el área de salida y la bola va a
reposar en el área de penalidad en el Punto A. El jugador elige jugar
desde el área de penalidad y juega al Punto B, que está fuera de límites.
El jugador puede aliviarse bajo golpe y distancia conforme a la Regla
18.2b usando el Punto A como p

============================================================
RULE 18
============================================================
Rule 18

RULE

18

Stroke-and-Distance Relief; Ball Lost
or Out of Bounds; Provisional Ball

Purpose of Rule:
Rule 18 covers taking relief under penalty of stroke and distance. When a ball
is lost outside a penalty area or comes to rest out of bounds, the required
progression of playing from the teeing area to the hole is broken; the player
must resume that progression by playing again from where the previous stroke
was made.
This Rule also covers how and when a provisional ball may be played to save
time when the ball in play might have gone out of bounds or be lost outside a
penalty area.

18.1 Relief Under Penalty of Stroke and Distance Allowed
at Any Time
At any time, a player may take stroke-and-distance relief by adding one penalty
stroke and playing the original ball or another ball from where the previous stroke
was made (see Rule 14.6).
The player always has this stroke-and-distance relief option:
• No matter where the player’s ball is on the course, and
• Even when a Rule requires the player to take relief in a certain way or to play a ball
from a certain place.
Once the player puts another ball in play under penalty of stroke and distance (see
Rule 14.4):
• The original ball is no longer in play and must not be played.
• This is true even if the original ball is then found on the course before the end of
the three-minute search time (see Rule 6.3b).
But this does not apply to a ball to be played from where the previous stroke was
made when the player:
• Announces that they are playing a provisional ball (see Rule 18.3b), or
• Is playing a second ball in stroke play under Rule 14.7b or 20.1c(3).

159

Rule 18

18.2 Ball Lost or Out of Bounds: Stroke-and-Distance Relief
Must Be Taken
18.2a When Ball Is Lost or Out of Bounds
(1) When Ball Is Lost. A ball is lost if not found in three minutes after the player or
their caddie begins to search for it.
If a ball is found in that time but it is uncertain whether it is the player’s ball:
• The player must promptly attempt to identify the ball (see Rule 7.2) and is
allowed a reasonable time to do so, even if that happens after the threeminute search time has ended.
• This includes a reasonable time to get to the ball if the player is not where the
ball is found.
If the player does not identify their ball in that reasonable time, the ball is lost.
(2) When Ball Is Out of Bounds. A ball at rest is out of bounds only when all of it is
outside the boundary edge of the course.
A ball is in bounds when any part of the ball:
• Lies on or touches the ground or anything else (such as any natural or artificial
object) inside the boundary edge, or
• Is above the boundary edge or any other part of the course.
A player may stand out of bounds to play a ball on the course.

160

Rule 18

DIAGRAM 18.2a: WHEN BALL 

-- OFFICIAL INTERPRETATIONS --

18.1/1 – Bola Colocada sobre un Tee Puede Ser Levantada Cuando
la Bola Original Es Encontrada Dentro del Período de Búsqueda de
Tres Minutos . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..272

18.1/2 – Penalidad No Puede Ser Evitada al Jugar Bajo Golpe y Distancia . 272
18.2a(1)/1 – Tiempo de Búsqueda Permitido Cuando la Búsqueda se
Interrumpió Temporariamente . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..273
18.2a(1)/2 – No es Requerido que el Caddie Comience la Búsqueda
de la Bola del Jugador Antes que el Jugador . . . . . . . . . . . . . . . . . . . . . . . . . ..274
18.2a(1)/3 – Significado de “Tiempo Razonable Para Hacerlo”
Cu

18.3a/1 – Cuando el Jugador Puede Jugar Bola Provisional . . . . . . . . . . . . . ..275
18.3a/2 – Está Permitido Jugar Bola Provisional Luego de Iniciada la
Búsqueda . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..275

18.3a/3 – Cada Bola se Relaciona Solo con la Bola Anterior Cuando
Es Jugada desde el Mismo Lugar . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..276

18.3b/1 – Declaraciones que “Indican Claramente” Que Se Está
Jugando una Bola Provisional . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..276
18.3c(1)/1 – Acciones Tomadas con la Bola Provisional Son una
Continuación de la Bola Provisional . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..276
18.3c(2)/1 – Punto Estimado de la Bola Original Es Usado para
Determinar Qué Bola Está en Juego . . . . . . . . . . .

18.1/1 – Bola Colocada sobre un Tee Puede Ser Levantada
Cuando la Bola Original Es Encontrada Dentro del Período de
Búsqueda de Tres Minutos
Cuando se juega nuevamente desde el área de salida, una bola que es
colocada, dropeada o colocada sobre un tee en el área de salida no está
en juego hasta que el jugador ejecute un golpe a la misma. (Definición de
“Bola en Juego” y Regla 6.2).
Por ejemplo, un jugador juega desde el área de salida, busca brevemente

18.1/2 – Penalidad No Puede Ser Evitada por Jugar Bajo
Golpe y Distancia
Si un jugador levanta su bola cuando no está autorizado a hacerlo, no
puede evitar la penalidad de un golpe bajo la Regla 9.4b decidiendo
luego jugar bajo golpe y distancia.
Por ejemplo, el golpe de salida de un jugador va a reposar a una zona
arbolada. El jugador levanta una bola creyendo que era una bola
extraviada, pero descubre que era su bola en juego. Luego el jugador
decid

18.3a/1 – Cuándo el Jugador Puede Jugar Bola Provisional
Cuando un jugador está decidiendo si tiene permitido jugar una bola
provisional, solo se considera la información que el jugador conoce en ese
momento.
Ejemplos de cuando una bola provisional puede ser jugada, incluyen
cuando:
• La bola original podría estar en un área de penalidad, pero también

podría estar perdida fuera de un área de penalidad o fuera de límites.
• Un jugador cree que la bola o

18.3a/2 – Está Permitido Jugar Bola Provisional Luego de
Iniciada la Búsqueda
Un jugador puede jugar una bola provisional por una bola que podría
estar perdida, hasta que el período de búsqueda de tres minutos haya
terminado.
Por ejemplo, si un jugador es capaz de regresar al lugar de su golpe previo y
jugar una bola provisional antes que finalice el período de búsqueda de tres
minutos, tiene permitido hacerlo.
Si el jugador juega la bola provisional y 

18.3a/3 – Cada Bola se Relaciona Solo con la Bola Anterior
Cuando Es Jugada desde el Mismo Lugar
Cuando un jugador juega múltiples bolas desde el mismo lugar, cada bola
se relaciona solamente con la bola previamente jugada.
Por ejemplo, un jugador juega una bola provisional creyendo que su golpe
de salida podría estar perdido o fuera de límites. La bola provisional es
golpeada en la misma dirección que la original y, sin ningún anuncio, juega
otra bola de

18.3b/1 – Declaraciones que “Indican Claramente” Que Se
Está Jugando una Bola Provisional
Cuando se juega una bola provisional, es mejor si el jugador usa la palabra
“provisional” en su anuncio. Sin embargo, se aceptan otras declaraciones
que dejan claro que la intención del jugador es jugar una bola provisional.
Ejemplos de anuncios que indican claramente que el jugador está jugando
una bola provisional incluyen:
• “Estoy jugando una bola bajo la Regl

============================================================
RULE 19
============================================================
Rule 19

RULE

19 Unplayable Ball
Purpose of Rule:
Rule 19 covers the player’s several relief options for an unplayable ball. This
allows the player to choose which option to use – normally with one penalty
stroke – to get out of a difficult situation anywhere on the course (except in a
penalty area).

19.1

Player May Decide to Take Unplayable Ball Relief Anywhere
Except Penalty Area

A player is the only person who may decide to treat their ball as unplayable by taking
penalty relief under Rule 19.2 or 19.3.
Unplayable ball relief is allowed anywhere on the course, except in a penalty area.
If a ball is unplayable in a penalty area, the player’s only relief option is to take
penalty relief under Rule 17.

19.2 Relief Options for Unplayable Ball in General Area or on
Putting Green
A player may take unplayable ball relief using one of the three options in Rule 19.2a,
b or c, in each case adding one penalty stroke.
• The player may take stroke-and-distance relief under Rule 19.2a even if the
original ball has not been found and identified.
• But to take back-on-the-line relief under Rule 19.2b or lateral relief under Rule
19.2c, the player must know the spot of the original ball.

19.2a Stroke-and-Distance Relief
The player may play the original ball or another ball from where the previous stroke
was made (see Rule 14.6).

166

Rule 19
19.2b Back-on-the-Line Relief
The player may drop the original ball or another ball (see Rule 14.3) behind the
spot of the original ball, keeping the spot of the original ball between the hole and
the spot where the ball is dropped (with no limit as to how far back the ball may be
dropped). The spot on the line where the ball first touches the ground when dropped
creates a relief area that is one club-length in any direction from that point, but with
these limits:
• Limits on Location of Relief Area:
» Must not be nearer the hole than the spot of the original ball, and
» May be in any area of the course, but
» Must be in the same area of the course that the ball first touched when dropped.

19.2c Lateral Relief
The player may drop the original ball or another ball in this lateral relief area (see
Rule 14.3):
• Reference Point: The spot of the original ball. But when the ball lies above the
ground, such as in a tree, the reference point is the spot directly below the ball on
the ground.
• Size of Relief Area Measured from Reference Point: Two club-lengths, but with
these limits:
• Limits on Location of Relief Area:
» Must not be nearer the hole than the reference point, and
» May be in any area of the course, but
» If more than one area of the course is located within two club-lengths of the
reference point, the ball must come to rest in the relief area in the same area of
the course that the ball first touched when drop

-- OFFICIAL INTERPRETATIONS --

19.2/1 – No Hay Garantía de que Una Bola Estará Jugable Luego de
Aliviarse por Bola Injugable . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..284

19.2/2 – La Bola Puede ser Dropeada en Cualquier Área del Campo
Cuando se Toma Alivio por Bola Injugable . . . . . . . . . . . . . . . . . . . . . . . . . . . ..284

19.2/3 – El Punto de Referencia de Golpe y Distancia No Cambia
Hasta Ejecutar el Golpe . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..285

19.2/4 – Jugador Puede Aliviarse Sin Penalidad Si Levanta Su Bola
Para Aliviarse por Bola Injugable y Antes de Dropear Descubre que
la Bola estaba en Terreno en Reparación . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 285

19.2/5 – Jugador Debe Encontrar la Bola para Usar las Opciones de
Alivio En Línea Hacia Atrás o Lateral . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..285

19.2a/1 – Jugador Puede Aliviarse Bajo Golpe y Distancia Aun
Cuando el Lugar del Golpe Anterior Esté Más Cerca del Hoyo Que
Donde Reposa la Bola Injugable . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .286

19.2a/2 – Alivio Bajo Golpe y Distancia está Permitido Solo en el
Punto del Último Golpe . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..286

VIII Procedimientos para Jugadores y el Comité Cuando
Surgen Cuestiones al Aplicar las Reglas (Regla 20)
Regla 20 - Resolviendo Cuestiones de Reglas Durante la Ronda;
Decisiones del Árbitro y del Comité . . . . . . . . . . . . . . . . . . . . 288
20.1 Resolviendo Cuestiones de Regl

19.2/1 – No Hay Garantía de que Una Bola Estará Jugable
Luego de Aliviarse por Bola Injugable
Al aliviarse por bola injugable, un jugador debe aceptar el resultado aunque
sea desfavorable, como cuando la bola dropeada va a reposar a su posición
original o en un mal lie en otra ubicación en el área de alivio:
• Una vez que la bola dropeada va a reposar en el área de alivio, el

jugador tiene una nueva situación.
• Si el jugador decide que no puede o no 

19.2/2 – La Bola Puede Ser Dropeada en Cualquier Área del
Campo Cuando se Toma Alivio por Bola Injugable
Según las opciones de alivio por bola injugable, un jugador puede aliviarse
dropeando una bola dentro del área de alivio en cualquier área del campo.
Esto incluye aliviarse desde el área general y dropear directamente en
un bunker o área de penalidad, sobre un green, dentro de una zona de
juego prohibido o sobre un green equivocado.
Sin embargo, si el

19.2/3 – El Punto de Referencia de Golpe y Distancia No
Cambia Hasta Ejecutar el Golpe
El punto de referencia usado al aliviarse bajo golpe y distancia no cambia
hasta que el jugador ejecuta otro golpe a su bola en juego, aún si el jugador
ha dropeado una bola bajo una Regla.
Por ejemplo, un jugador se alivia por una bola injugable y dropea una bola
bajo la opción en línea hacia atrás o lateral. La bola dropeada queda
dentro del área de alivio, pero ru

19.2/4 – Jugador Puede Aliviarse Sin Penalidad Si Levanta Su
Bola Para Aliviarse por Bola Injugable y Antes de Dropear
Descubre que la Bola estaba en Terreno en Reparación
Si un jugador levanta su bola para aliviarse por bola injugable y luego
descubre que estaba en terreno en reparación u otra condición anormal
del campo, todavía puede aliviarse sin penalidad bajo la Regla 16.1 en
tanto no haya puesto todavía una bola en juego bajo la Regla 19 al
aliviarse

19.2/5 – Jugador Debe Encontrar la Bola para Usar las
Opciones de Alivio En Línea Hacia Atrás o Lateral
Las opciones de alivio en línea hacia atrás y lateral bajo la Regla 19.2 y
19.3 no pueden aplicarse sin encontrar la bola original, en tanto ambas
requieren usar el punto donde ésta se encuentra como punto de referencia
para el alivio. Si alguna de esas opciones de alivio es utilizada para aliviarse
por bola injugable con referencia a una bola que 

============================================================
RULE 20
============================================================
Rule 20

RULE

20

Resolving Rules Issues During Round;
Rulings by Referee and Committee

Purpose of Rule:
Rule 20 covers what players should do when they have questions about the Rules
during a round, including the procedures (which differ in match play and stroke
play) allowing a player to protect the right to get a ruling at a later time.
The Rule also covers the role of referees who are authorized to decide questions
of fact and apply the Rules. Rulings from a referee or the Committee are binding
on all players.

20.1 Resolving Rules Issues During Round
20.1a Players Must Avoid Unreasonable Delay
Players must not unreasonably delay play when seeking help with the Rules during
a round:
• If a referee or the Committee is not available in a reasonable time to help with a
Rules issue, the player must decide what to do and play on.
• The player may protect their rights by asking for a ruling in match play (see Rule
20.1b(2)) or by playing two balls in stroke play (see Rule 20.1c(3)).

20.1b Rules Issues in Match Play
(1) Deciding Issues by Agreement. During a round, the players in a match may agree
how to decide a Rules issue:
• The agreed outcome is conclusive even if it turns out to have been wrong
under the Rules, so long as the players did not agree to ignore any Rule or
penalty they knew applied (see Rule 1.3b(1)).
• But if a referee is assigned to the match, the referee must rule on any issue
that comes to their attention in time (see Rule 20.1b(2)) and the players must
follow that ruling.
In the absence of a referee, if the players do not agree or have doubt about how
the Rules apply, either player may request a ruling under Rule 20.1b(2).

172

Rule 20

(2) Ruling Request Made Before Result of Match Is Final. When a player wants a
referee or the Committee to decide how to apply the Rules to their own play or the
opponent’s play, the player may make a request for a ruling.
If a referee or the Committee is not available in a reasonable time, the player may
make the request for a ruling by notifying the opponent that a later ruling will be
sought when a referee or the Committee becomes available.
If a player makes a request for a ruling before the result of the match is final:
• A ruling will be given only if the request is made in time, which depends on
when the player becomes aware of the facts creating the Rules issue:
» When Player Becomes Aware of the Facts Before Either Player Starts the
Final Hole of the Match. When the player becomes aware of the facts, the
ruling request must be made before either player makes a stroke to begin
another hole.
» When Player Becomes Aware of the Facts During or After Completion of the
Final Hole of the Match. The ruling request must be made before the result
of the match is final (see Rule 3.2a(5)).
• If th

============================================================
RULE 21
============================================================
Rule 21

RULE

21

Other Forms of Individual Stroke Play
and Match Play

Purpose of Rule:
Rule 21 covers four other forms of individual play, including three forms of stroke
play where scoring is different than in regular stroke play: Stableford (scoring by
points awarded on each hole); Maximum Score (the score for each hole is capped
at a maximum); and Par/Bogey (match play scoring used on a hole-by-hole basis).

21.1 Stableford
21.1a Overview of Stableford
Stableford is a form of stroke play where:
• A player’s or side’s score for a hole is based on points awarded by comparing the
player’s or side’s number of strokes (including strokes made and penalty strokes)
on the hole to a fixed target score for the hole set by the Committee, and
• The competition is won by the player or side who completes all rounds with the
most points.
The Rules for stroke play in Rules 1-20 apply, as modified 

-- OFFICIAL INTERPRETATIONS --

21.4/1 – En Three-Ball Match Play Cada Jugador está Jugando Dos
Matches Distintos . . . . . . . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . . . . . . . . . . . . . .311

19

Contenidos
Regla

21.4/1 – En Three-Ball Match Play Cada Jugador está Jugando
Dos Matches Distintos
En three-ball match play, como cada jugador está jugando dos matches
distintos, pueden surgir situaciones que afecten a un match

============================================================
RULE 22
============================================================
Rule 22

RULE

22

Foursomes (Also Known
as Alternate Shot)

Purpose of Rule:
Rule 22 covers Foursomes (played either in match play or stroke play), where two
partners compete together as a side by alternating in making strokes at a single
ball. The Rules for this form of play are essentially the same as for individual play,
except for requiring the partners to alternate in teeing off to start a hole and to
play out each hole with alternate shots.

22.1 Overview of Foursomes
Foursomes (also known as Alternate Shot) is a form of play involving partners (in
either match play or stroke play) where two partners compete as a side by playing
one ball in alternating order on each hole.
Rules 1-20 apply to this form of play (with the side playing one ball being treated
in the same way as the individual player is treated), as modified by these specific
Rules.
A variation of this is a form of matc

-- OFFICIAL INTERPRETATIONS --

22.3/1 – Cuando se Juega Nuevamente desde el Área de Salida en un
Mixed Foursomes la Bola Debe ser Jugada desde la Misma Área de Salida 315

22.3/2 – Decidiendo Qué Bola Está en Juego Cuando Ambos
Compañeros en Foursomes Jugaron el Golpe de Salida Desde la
Misma Área de Salida . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

22.3/3 – Jugador No Puede Errar Intencionalmente a la Bola para
que Su Compañero Pueda Jugar . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..316

22.3/4 – Cómo Proceder Cuando la Bola Provisional Fue Jugada por
el Compañero Equivocado . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..316

Regla 23 - Four-Ball . . . . . . . 

============================================================
RULE 23
============================================================
Rule 23

RULE

23 Four-Ball
Purpose of Rule:
Rule 23 covers Four-Ball (played either in match play or stroke play), where
partners compete as a side with each playing a separate ball. The side’s score for
a hole is the lower score of the partners on that hole.

23.1 Overview of Four-Ball
Four-Ball is a form of play (in either match play or stroke play) involving partners where:
• Two partners compete together as a side, with each player playing their own
ball, and
• A side’s score for a hole is the lower score of the two partners on that hole.
Rules 1-20 apply to this form of play, as modified by these specific Rules.
A variation of this is a form of match play known as Best-Ball, where an individual
player competes against a side of two or three partners and each partner plays their
own ball under the Rules, as modified by these specific Rules. (For Best-Ball with
three partners on a si

-- OFFICIAL INTERPRETATIONS --

23.2a/1 – Resultado del Hoyo Cuando Ninguna Bola es Embocada
Correctamente . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..326

23.2b/1 – El Score para el Hoyo Debe Estar Identificado con el
Compañero Correcto . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ..326

23.2b/2 – Aplicación de la Excepción a la Regla 3.3b(3) por Entregar
una Tarjeta de Score Incorrecta . . . . . . . . . . . . . . . . . . . . .. . . . . . . . . . . . . . . . .. 327

23.4/1 – Determinación del Hándicap Asignado en Match Play Si Un
Jugador No Puede Competir . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .. 328

============================================================
RULE 24
============================================================
Rule 24

RULE

24 Team Competitions
Purpose of Rule:
Rule 24 covers team competitions (played in either match play or stroke play),
where multiple players or sides compete as a team with the results of their rounds
or matches combined to produce an overall team score.

24.1 Overview of Team Competitions
• A “team” is a group of players who play as individuals or as sides to compete
against other teams.
• Their play in the team event may also be part of another competition (such as
individual stroke play) that takes place at the same time.
Rules 1-23 apply in a team competition, as modified by these specific Rules.

24.2 Terms of Team Competition
The Committee decides the form of play, how a team’s overall score is to be
calculated and other Terms of the Competition, such as:
• In match play, the number of points awarded for winning or tying a match.
• In stroke play, the number of scores

-- OFFICIAL INTERPRETATIONS --

24.4/1 – El Comité Puede Establecer Límites a los Capitanes de
Equipos y Consejeros . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 335

21

Contenidos
X. Modificac

24.4/1 – El Comité Puede Establecer Límites para Capitanes y
Consejeros de Equipos
El Comité puede adoptar una Regla Local limitando quien puede actuar
como capitán o consejero de equipo, y también limitar la co

============================================================
RULE 25
============================================================
Rule 25

RULE

25

Modifications for Players
with Disabilities

Purpose of Rule:
Rule 25 provides modifications to certain Rules of Golf to allow players with
specific disabilities to play fairly with players who have no disabilities, the same
disability or a different type of disability.

25.1 Overview
Rule 25 applies to all competitions, including all forms of play. It is a player’s
category of disability and eligibility that determine whether they can use the specific
modified Rules in Rule 25.
Rule 25 modifies certain Rules for players in the following categories of disability:
• Players who are blind (which includes certain levels of vision impairment),
• Players who are amputees (which means both those with limb deficiencies and
those who have lost a limb),
• Players who use assistive mobility devices, and
• Players with intellectual disabilities.
It is recognized that there are ma`;

// ══════════════════════════════════════════════════════════════════════════
// FASE 1 — Extraer hechos + assumed facts
// POST /phase1   { description, lang, category }
// ══════════════════════════════════════════════════════════════════════════
app.post("/phase1", async (req, res) => {
  try {
    const { description, lang = "es", category = "" } = req.body;

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: "Description too short" });
    }

    addLog("phase1_req", { lang, category, len: description.length });

    const system = `You are an expert golf rules analyst using the Official Rules of Golf 2023 (R&A/USGA).
Extract objective facts AND system assumptions from the user description of a golf rules situation.
Respond ONLY with valid JSON — no markdown, no code blocks, no extra text.

JSON structure:
{
  "facts": [
    { "id": 1, "text": "fact in language ${lang}", "key": "short_key" }
  ],
  "assumedFacts": [
    "assumption the system makes that was NOT stated by user"
  ],
  "detectedRule": "Rule number and name most likely applicable",
  "category": "detected category"
}

Rules:
- facts: 3-8 items, each a simple objective statement from user input
- assumedFacts: always include: "Standard competition rules apply", "No local rules provided", and any other relevant assumptions
- For ball in elevated position (tree, net, stands): ALWAYS include assumed fact: "Reference point is the spot on the ground directly below where the ball rests"
- detectedRule: cite the most likely rule (e.g. "Rule 19 – Unplayable Ball")
- Write facts in language: ${lang}`;

    const userContent = `Golf situation category: ${category || "general"}

User description:
${description}

Extract facts and assumptions as JSON.`;

    const raw = await callClaude(system, userContent, 1024);
    let parsed;
    try {
      parsed = JSON.parse(cleanJSON(raw));
    } catch {
      addLog("phase1_parse_err", { raw: raw.slice(0, 300) });
      return res.status(500).json({ error: "Failed to parse AI response", raw: raw.slice(0, 200) });
    }

    addLog("phase1_ok", { factsCount: parsed.facts?.length, rule: parsed.detectedRule });
    res.json(parsed);
  } catch (err) {
    addLog("phase1_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FASE 2 — Pass-through instantáneo
// POST /phase2   { facts, lang }
// ══════════════════════════════════════════════════════════════════════════
app.post("/phase2", async (req, res) => {
  try {
    const { facts, lang = "es" } = req.body;
    if (!facts || !Array.isArray(facts) || facts.length === 0) {
      return res.status(400).json({ error: "No facts provided" });
    }
    addLog("phase2_req", { factsCount: facts.length, lang });
    const questions = facts.map((f) => ({ id: f.id, key: f.key, fact: f.text }));
    res.json({ questions });
  } catch (err) {
    addLog("phase2_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// FASE 3 — Ruling oficial basado en KB de reglas + hechos confirmados
// POST /ruling   { confirmedFacts, deniedFacts, assumedFacts, category, lang }
// ══════════════════════════════════════════════════════════════════════════
app.post("/ruling", async (req, res) => {
  try {
    const {
      confirmedFacts = [],
      deniedFacts = [],
      assumedFacts = [],
      category = "",
      lang = "es",
    } = req.body;

    if (!confirmedFacts || confirmedFacts.length === 0) {
      return res.status(400).json({ error: "No confirmed facts provided" });
    }

    addLog("ruling_req", {
      confirmed: confirmedFacts.length,
      denied: deniedFacts.length,
      assumed: assumedFacts.length,
      lang, category,
    });

    const confirmedList = confirmedFacts
      .map((f, i) => `${i + 1}. ${f.fact || f.text || f}`)
      .join("\n");

    const deniedList = deniedFacts.length > 0
      ? deniedFacts.map((f, i) => `${i + 1}. ${f.fact || f.text || f}`).join("\n")
      : "None";

    const assumedList = assumedFacts.length > 0
      ? assumedFacts.map((a, i) => `${i + 1}. ${a}`).join("\n")
      : "Standard competition rules apply. No local rules provided.";

    const system = `You are an official golf rules referee using the 2023 Official Rules of Golf (R&A/USGA).

KNOWLEDGE BASE — use this as your primary reference:
${GOLF_KB.slice(0, 28000)}

CRITICAL INSTRUCTIONS:
1. Base ruling ONLY on confirmed facts. Never invent facts.
2. NEVER automatically declare the ball unplayable — the player decides. State: "The player may play the ball as it lies if they choose."
3. For balls in elevated positions (tree, net, stands, fence): the reference point for ALL relief options is the spot on the GROUND directly below where the ball rests — never the elevated position itself.
4. Present ALL available options with their rule citations. Do not pre-select one option.
5. Use official, neutral language. No "most common" recommendations.
6. Always cite the specific Rule number and sub-section (e.g., Rule 19.2c).
7. Confidence: assess 0-100 based on completeness of confirmed facts.
8. Respond in language: ${lang}

Use EXACTLY these section headers:

## RULING
[State all available options. If player CAN play as it lies, list that first. Then list penalty relief options numbered.]

## RULE APPLIED
[Exact rule number, sub-section, and official name. E.g.: "Rule 19.2 – Relief Options for Unplayable Ball in General Area"]

## INTERPRETATION
[2-3 sentences applying the rule to these specific confirmed facts. If elevated position: state the ground reference point explicitly.]

## EXCEPTIONS & EDGE CASES
[1-3 bullet points: conditions that would change this ruling if they applied]

## ASSUMED FACTS
[List system assumptions not stated by user]

## CONFIDENCE
[Number 0-100 — one sentence explanation]

## DISCLAIMER
Final rulings in competition are determined by the Committee or an authorized referee. This analysis is based solely on the confirmed facts provided.`;

    const userContent = `GOLF SITUATION: ${category || "General"}

CONFIRMED FACTS:
${confirmedList}

DENIED FACTS:
${deniedList}

SYSTEM ASSUMPTIONS:
${assumedList}

Deliver the official ruling.`;

    const ruling = await callClaude(system, userContent, 1600);

    addLog("ruling_ok", { len: ruling.length });
    res.json({ ruling, confirmedCount: confirmedFacts.length });
  } catch (err) {
    addLog("ruling_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════
// /api/rules — Endpoint unificado para el frontend de chat
// POST /api/rules  { model, max_tokens, system, messages }
// Proxy directo a Claude — mismo formato que la API de Anthropic
// ══════════════════════════════════════════════════════════════════════════
app.post("/api/rules", async (req, res) => {
  try {
    const { model, max_tokens, system, messages } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: "No messages provided" });
    }

    addLog("api_rules_req", {
      msgCount: messages.length,
      lastMsg: messages[messages.length - 1]?.content?.slice(0, 80)
    });

    const response = await client.messages.create({
      model: model || MODEL,
      max_tokens: max_tokens || 1500,
      system: system || "",
      messages: messages,
    });

    addLog("api_rules_ok", { len: response.content[0]?.text?.length });
    res.json(response);
  } catch (err) {
    addLog("api_rules_err", { msg: err.message });
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════
app.get("/admin", (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(503).send("Admin deshabilitado: configura ADMIN_PASSWORD en Render");
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).send(`
      <html><body style="font-family:sans-serif;padding:2rem;background:#0f0f0f;color:#eee">
        <h2 style="color:#4ade80">🔒 FairPlay Admin</h2>
        <form style="margin-top:1rem">
          <input name="password" type="password" placeholder="Password"
            style="padding:.6rem;font-size:1rem;background:#1a1a1a;border:1px solid #333;color:#eee;border-radius:4px"/>
          <button type="submit"
            style="padding:.6rem 1.2rem;margin-left:.5rem;background:#4ade80;color:#000;border:none;border-radius:4px;cursor:pointer">
            Enter
          </button>
        </form>
      </body></html>
    `);
  }
  const rows = logs.map((l) => `
    <tr>
      <td style="color:#888;white-space:nowrap;font-size:11px">${l.ts}</td>
      <td><b style="color:#4ade80">${l.type}</b></td>
      <td><pre style="margin:0;font-size:11px;max-width:520px;overflow-x:auto">${JSON.stringify(l.data, null, 2)}</pre></td>
    </tr>`).join("");

  res.send(`
    <html>
    <head>
      <title>FairPlay Admin</title>
      <style>
        body{font-family:sans-serif;padding:1rem;background:#0a0a0a;color:#eee}
        h2{color:#4ade80;margin-bottom:.3rem}
        table{border-collapse:collapse;width:100%;font-size:12px;margin-top:1rem}
        th{background:#1a1a1a;padding:.5rem .7rem;text-align:left;color:#aaa}
        td{border-bottom:1px solid #1a1a1a;padding:.5rem .7rem;vertical-align:top}
        pre{background:#111;padding:.4rem;border-radius:4px;color:#ccc}
        a{color:#4ade80}
      </style>
      <meta http-equiv="refresh" content="30">
    </head>
    <body>
      <h2>⚖️ FairPlay Rules — Admin</h2>
      <p style="color:#666;font-size:12px">${logs.length} entries · auto-refresh 30s ·
        <a href="/admin?password=${password}">Refresh</a> · <a href="/health">Health</a>
      </p>
      <table>
        <tr><th>Timestamp</th><th>Event</th><th>Data</th></tr>
        ${rows || '<tr><td colspan="3" style="color:#555;padding:1rem">No logs yet</td></tr>'}
      </table>
    </body></html>
  `);
});

// ── Health ────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", model: MODEL, kbSize: GOLF_KB.length, logs: logs.length, uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`FairPlay Rules API v3.0 (Golf KB embedded) on port ${PORT}`);
});
