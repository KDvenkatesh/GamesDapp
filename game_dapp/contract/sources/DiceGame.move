module GameDapp::Games {
    use std::signer;
    use std::table::{Self, Table};
    use std::vector;

    // -------------------------
    // Player data structs (per-game)
    // -------------------------
    struct DiceData has store { rolls: vector<u8>, score: u64 }
    struct RPSData has store { result: u8 }                     // 0=draw,1=win,2=lose
    struct SnakeData has store { position: u8 }
    struct MysteryData has store { last_prize: u8 }

    struct TreasureData has store { chests_opened: u64, last_reward: u8, collection: vector<u8> }
    struct RacingData has store { races_played: u64, wins: u64, last_vehicle: u8 }
    struct TimeRiftData has store { runs: u64, best_time: u64, last_seed: u64 }
    struct BattleRoyaleData has store { matches: u64, wins: u64, last_skin: u8 }

    struct TicTacToeData has store { wins: u64, losses: u64, draws: u64 }
    struct HangmanData has store { wins: u64 }
    struct MemoryMatchData has store { games_won: u64, best_moves: u64 }
    struct FlappyCloneData has store { high_score: u64, games_played: u64 }

    // -------------------------
    // Singleton storage (one per module deployer/admin)
    // -------------------------
    struct GameStorage has key {
        dice_table: Table<address, DiceData>,
        rps_table: Table<address, RPSData>,
        snake_table: Table<address, SnakeData>,
        mystery_table: Table<address, MysteryData>,

        treasure_table: Table<address, TreasureData>,
        racing_table: Table<address, RacingData>,
        time_rift_table: Table<address, TimeRiftData>,
        battle_royale_table: Table<address, BattleRoyaleData>,

        tictactoe_table: Table<address, TicTacToeData>,
        hangman_table: Table<address, HangmanData>,
        memory_table: Table<address, MemoryMatchData>,
        flappy_table: Table<address, FlappyCloneData>,
    }

    // -------------------------
    // Initialize storage (call once by deployer/admin)
    // -------------------------
    public entry fun init(admin: &signer) {
        // ensure we don't re-init
        let admin_addr = signer::address_of(admin);
        assert!(!exists<GameStorage>(admin_addr), 0);
        move_to(admin, GameStorage {
            dice_table: table::new(),
            rps_table: table::new(),
            snake_table: table::new(),
            mystery_table: table::new(),

            treasure_table: table::new(),
            racing_table: table::new(),
            time_rift_table: table::new(),
            battle_royale_table: table::new(),

            tictactoe_table: table::new(),
            hangman_table: table::new(),
            memory_table: table::new(),
            flappy_table: table::new(),
        });
    }



    // -------------------------
    // === 2D ORIGINAL GAMES ===
    // -------------------------

    // Dice: record a roll for a player
    public entry fun dice_roll(admin: &signer, player: address, value: u8) acquires GameStorage {
        assert!(value >= 1 && value <= 6, 100);
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let dice_data = if (table::contains(&storage.dice_table, player)) {
            table::borrow_mut(&mut storage.dice_table, player)
        } else {
            let new_data = DiceData { rolls: vector::empty<u8>(), score: 0 };
            table::add(&mut storage.dice_table, player, new_data);
            table::borrow_mut(&mut storage.dice_table, player)
        };
        vector::push_back(&mut dice_data.rolls, value);
        dice_data.score = dice_data.score + (value as u64);
    }

    public fun get_dice_score(admin_addr: address, player: address): u64 acquires GameStorage {
    let storage = borrow_global<GameStorage>(admin_addr);
        if (table::contains(&storage.dice_table, player)) {
            table::borrow(&storage.dice_table, player).score
        } else {
            0
        }
    }

    public fun get_dice_rolls(admin_addr: address, player: address): vector<u8> acquires GameStorage {
    let storage = borrow_global<GameStorage>(admin_addr);
        if (table::contains(&storage.dice_table, player)) {
            let rolls_ref = &table::borrow(&storage.dice_table, player).rolls;
            let rolls_copy = vector::empty<u8>();
            let len = vector::length(rolls_ref);
            let i = 0;
            while (i < len) {
                vector::push_back(&mut rolls_copy, *vector::borrow(rolls_ref, i));
                i = i + 1;
            };
            rolls_copy
        } else {
            vector::empty<u8>()
        }
    }

    // Rock-Paper-Scissors
    // choice: 0=rock,1=paper,2=scissors
    public entry fun play_rps(admin: &signer, player: address, choice: u8) acquires GameStorage {
        assert!(choice <= 2, 101);
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let contract_choice: u8 = 1; // simple fixed opponent choice (change as needed)
        let result = if (choice == contract_choice) {
            0
        } else if ((choice == 0 && contract_choice == 2) ||
                   (choice == 1 && contract_choice == 0) ||
                   (choice == 2 && contract_choice == 1)) {
            1
        } else {
            2
        };
        let rps_data = RPSData { result };
        if (table::contains(&storage.rps_table, player)) {
            table::remove(&mut storage.rps_table, player);
        };
        table::add(&mut storage.rps_table, player, rps_data);
    }

    public fun get_rps_result(admin_addr: address, player: address): u8 acquires GameStorage {
    let storage = borrow_global<GameStorage>(admin_addr);
        if (table::contains(&storage.rps_table, player)) {
            table::borrow(&storage.rps_table, player).result
        } else {
            0
        }
    }

    // Snake & Ladders (position moves from 1..100)
    // Move does not support tuple constants, so use two vectors: starts and ends
    const SNAKE_LADDER_STARTS: vector<u8> = vector[
        16, 47, 49, 56, 62, 64, 87, 93, 95, 98, 1, 4, 9, 21, 28, 36, 51, 71, 80
    ];
    const SNAKE_LADDER_ENDS: vector<u8> = vector[
        6, 26, 11, 53, 19, 60, 24, 73, 75, 78, 38, 14, 31, 42, 84, 44, 67, 91, 100
    ];

    fun find_snake_ladder(pos: u8): u8 {
        let len = vector::length(&SNAKE_LADDER_STARTS);
        let i = 0;
        while (i < len) {
            let start = *vector::borrow(&SNAKE_LADDER_STARTS, i);
            let end = *vector::borrow(&SNAKE_LADDER_ENDS, i);
            if (start == pos) {
                return end;
            };
            i = i + 1;
        };
        pos
    }

    public entry fun init_snake(admin: &signer, player: address) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);
        if (!table::contains(&storage.snake_table, player)) {
            table::add(&mut storage.snake_table, player, SnakeData { position: 1 });
        }
    }

    public entry fun move_snake(admin: &signer, player: address, steps: u8) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let snake_data = if (table::contains(&storage.snake_table, player)) {
            table::borrow_mut(&mut storage.snake_table, player)
        } else {
            table::add(&mut storage.snake_table, player, SnakeData { position: 1 });
            table::borrow_mut(&mut storage.snake_table, player)
        };

        let temp_pos = snake_data.position + steps;
        let new_pos = if (temp_pos > 100) { snake_data.position } else { find_snake_ladder(temp_pos) };
        snake_data.position = new_pos;
    }

    public fun get_snake_position(admin_addr: address, player: address): u8 acquires GameStorage {
    let storage = borrow_global<GameStorage>(admin_addr);
        if (table::contains(&storage.snake_table, player)) {
            table::borrow(&storage.snake_table, player).position
        } else {
            1
        }
    }

    // Mystery Box (simple prize index)
    public entry fun open_mystery_box(admin: &signer, player: address, prize_index: u8) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);
        let data = MysteryData { last_prize: prize_index };
        if (table::contains(&storage.mystery_table, player)) {
            table::remove(&mut storage.mystery_table, player);
        };
        table::add(&mut storage.mystery_table, player, data);
    }

    public fun get_mystery_prize(admin_addr: address, player: address): u8 acquires GameStorage {
    let storage = borrow_global<GameStorage>(admin_addr);
        if (table::contains(&storage.mystery_table, player)) {
            table::borrow(&storage.mystery_table, player).last_prize
        } else {
            255u8
        }
    }

    // -------------------------
    // === 3D GAME METHODS ===
    // -------------------------

    // Treasure chests
    public entry fun open_treasure_chest(admin: &signer, player: address, reward: u8, item_id: u8) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.treasure_table, player)) {
            table::borrow_mut(&mut storage.treasure_table, player)
        } else {
            let new_data = TreasureData { chests_opened: 0, last_reward: 0, collection: vector::empty<u8>() };
            table::add(&mut storage.treasure_table, player, new_data);
            table::borrow_mut(&mut storage.treasure_table, player)
        };

        data.chests_opened = data.chests_opened + 1;
        data.last_reward = reward;
        vector::push_back(&mut data.collection, item_id);
    }

    public fun get_treasure_data(admin_addr: address, player: address): TreasureData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.treasure_table, player)
    }

    // Racing
    public entry fun record_race(admin: &signer, player: address, win: bool, vehicle: u8) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.racing_table, player)) {
            table::borrow_mut(&mut storage.racing_table, player)
        } else {
            let new_data = RacingData { races_played: 0, wins: 0, last_vehicle: 0 };
            table::add(&mut storage.racing_table, player, new_data);
            table::borrow_mut(&mut storage.racing_table, player)
        };

        data.races_played = data.races_played + 1;
    if (win) { data.wins = data.wins + 1; };
    data.last_vehicle = vehicle;
    }

    public fun get_racing_data(admin_addr: address, player: address): RacingData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.racing_table, player)
    }

    // Time Rift
    public entry fun record_time_rift_run(admin: &signer, player: address, time: u64, seed: u64) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.time_rift_table, player)) {
            table::borrow_mut(&mut storage.time_rift_table, player)
        } else {
            let new_data = TimeRiftData { runs: 0, best_time: 0, last_seed: 0 };
            table::add(&mut storage.time_rift_table, player, new_data);
            table::borrow_mut(&mut storage.time_rift_table, player)
        };

        data.runs = data.runs + 1;
    if (data.best_time == 0 || time < data.best_time) { data.best_time = time; };
    data.last_seed = seed;
    }

    public fun get_time_rift_data(admin_addr: address, player: address): TimeRiftData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.time_rift_table, player)
    }

    // Battle Royale
    public entry fun record_battle_royale(admin: &signer, player: address, win: bool, skin: u8) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.battle_royale_table, player)) {
            table::borrow_mut(&mut storage.battle_royale_table, player)
        } else {
            let new_data = BattleRoyaleData { matches: 0, wins: 0, last_skin: 0 };
            table::add(&mut storage.battle_royale_table, player, new_data);
            table::borrow_mut(&mut storage.battle_royale_table, player)
        };

        data.matches = data.matches + 1;
    if (win) { data.wins = data.wins + 1; };
    data.last_skin = skin;
    }

    public fun get_battle_royale_data(admin_addr: address, player: address): BattleRoyaleData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.battle_royale_table, player)
    }

    // -------------------------
    // === NEW 2D GAMES ===
    // -------------------------

    // Tic-Tac-Toe
    // result: 0 = win, 1 = loss, 2 = draw
    public entry fun record_tictactoe_game(admin: &signer, player: address, result: u8) acquires GameStorage {
        assert!(result <= 2, 200);
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.tictactoe_table, player)) {
            table::borrow_mut(&mut storage.tictactoe_table, player)
        } else {
            let new_data = TicTacToeData { wins: 0, losses: 0, draws: 0 };
            table::add(&mut storage.tictactoe_table, player, new_data);
            table::borrow_mut(&mut storage.tictactoe_table, player)
        };

        if (result == 0) { data.wins = data.wins + 1; }
        else if (result == 1) { data.losses = data.losses + 1; }
        else { data.draws = data.draws + 1; }
    }

    public fun get_tictactoe_data(admin_addr: address, player: address): TicTacToeData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.tictactoe_table, player)
    }

    // Hangman (count wins)
    public entry fun record_hangman_win(admin: &signer, player: address) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.hangman_table, player)) {
            table::borrow_mut(&mut storage.hangman_table, player)
        } else {
            let new_data = HangmanData { wins: 0 };
            table::add(&mut storage.hangman_table, player, new_data);
            table::borrow_mut(&mut storage.hangman_table, player)
        };

        data.wins = data.wins + 1;
    }

    public fun get_hangman_data(admin_addr: address, player: address): HangmanData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.hangman_table, player)
    }

    // Memory Match
    public entry fun record_memory_match_win(admin: &signer, player: address, moves: u64) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.memory_table, player)) {
            table::borrow_mut(&mut storage.memory_table, player)
        } else {
            let new_data = MemoryMatchData { games_won: 0, best_moves: 0 };
            table::add(&mut storage.memory_table, player, new_data);
            table::borrow_mut(&mut storage.memory_table, player)
        };

        data.games_won = data.games_won + 1;
        if (data.best_moves == 0 || moves < data.best_moves) {
            data.best_moves = moves;
        }
    }

    public fun get_memory_data(admin_addr: address, player: address): MemoryMatchData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.memory_table, player)
    }

    // Flappy Clone
    public entry fun record_flappy_score(admin: &signer, player: address, score: u64) acquires GameStorage {
        let admin_addr = signer::address_of(admin);
    let storage = borrow_global_mut<GameStorage>(admin_addr);

        let data = if (table::contains(&storage.flappy_table, player)) {
            table::borrow_mut(&mut storage.flappy_table, player)
        } else {
            let new_data = FlappyCloneData { high_score: 0, games_played: 0 };
            table::add(&mut storage.flappy_table, player, new_data);
            table::borrow_mut(&mut storage.flappy_table, player)
        };

        data.games_played = data.games_played + 1;
        if (score > data.high_score) { data.high_score = score; }
    }

    public fun get_flappy_data(admin_addr: address, player: address): FlappyCloneData acquires GameStorage {
        let storage = borrow_global<GameStorage>(admin_addr);
        *table::borrow(&storage.flappy_table, player)
    }
}