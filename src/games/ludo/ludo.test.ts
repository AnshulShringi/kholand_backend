import { Game, GameState } from './game'
import { Player } from './player';
import { User } from '../../components/users/model';


jest.mock('./utils', () => {
    const originalModule = jest.requireActual('./utils');

    return {
        __esModule: true,
        ...originalModule,
        biasedRandom: jest
            .fn(() => 1)
            .mockImplementationOnce(() => 2)
            .mockImplementationOnce(() => 6),
    };
});

describe('Game', () => {
    describe('Test LUDO', () => {
        it('test ludo flow', async () => {

            const user1 = new User();
            const user2 = new User();
            const player1 = new Player(user1);
            const player2 = new Player(user2);
            
            const game = new Game([player1, player2]);
            
            expect(game.CurrentPlayer.PlayerIndex).toEqual(player1.PlayerIndex);
            expect(player1.PlayerIndex).toEqual(0);
            expect(player2.PlayerIndex).toEqual(2);

            expect(() => {
                game.playTurn(player2, "");
            }).toThrow();

            expect(() => {
                game.rollDice(player2);
            }).toThrow();

            const diceNumber2 = game.rollDice(player1);
            expect(game.GameState).toEqual(GameState.GOTTI_MOVED_NEEDED);
            expect(diceNumber2).toEqual(2);

            //game.diceNumber = 2;
            const moveableGottiDice2 = game.MovableGottis;
            expect(moveableGottiDice2).toEqual([]);

            game.passTurn(player1);
            game.setNextPlayer(player1);
            expect(game.CurrentPlayer).toEqual(player2);

            // game.diceNumber = 6;
            const diceNumber6 = game.rollDice(player2);
            expect(game.GameState).toEqual(GameState.GOTTI_MOVED_NEEDED);
            expect(diceNumber6).toEqual(6);
            const moveableGottiDice6 = game.MovableGottis;
            expect(moveableGottiDice6).toEqual([ 'yellow-0', 'yellow-1', 'yellow-2', 'yellow-3' ]);

            // wrong player
            expect(() => {
                game.playTurn(player1, 'yellow-1');
            }).toThrow();
            expect(game.GameState).toEqual(GameState.GOTTI_MOVED_NEEDED);

            // wrong gotti
            expect(() => {
                game.playTurn(player2, 'red-1');
            }).toThrow();
            expect(game.GameState).toEqual(GameState.GOTTI_MOVED_NEEDED);

            game.playTurn(player2, 'yellow-0');
            expect(game.GameState).toEqual(GameState.MOVE_TO_NEXT_PLAYER);

            // Red player turn
            // before dice rolling
            expect(() => {
                game.playTurn(player1, 'red-1');
            }).toThrow();
            expect(game.GameState).toEqual(GameState.MOVE_TO_NEXT_PLAYER);

            // wrong player
            expect(() => {
                game.rollDice(player2);
            }).toThrow();
            expect(game.GameState).toEqual(GameState.MOVE_TO_NEXT_PLAYER);

            // player-2 passing turn to player-1
            game.setNextPlayer(player2);
            
            const diceNumberYellow = game.rollDice(player2);
            expect(game.GameState).toEqual(GameState.GOTTI_MOVED_NEEDED);
            expect(diceNumberYellow).toBeGreaterThanOrEqual(1);
            expect(diceNumberYellow).toBeLessThanOrEqual(6);

            const isCurrentPLayer = game.CurrentPlayer == player1;
            game.playerQuit(player1, isCurrentPLayer);
            expect(game.GameState).toEqual(GameState.GAME_OVER);
            expect(game.Winner?.PlayerColor).toEqual(player2.PlayerColor);

        });
    })
});
