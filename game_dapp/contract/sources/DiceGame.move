module GameDapp::Games {
    use std::signer;
    use std::table::{Self, Table};
    use std::vector;

    // === Game Data Structs ===

    // --- Original 2D Games ---
    struct DiceData has key {
        rolls: vector<u8>,
        score: u64,
    }

    struct RPSData has key {
        choice: u8, // 0=rock,1=paper,2=scissors
        result: u8, // 0=draw,1=win,2=lose
    }

    struct SnakeData has key {
        position: u8,
    }

    struct MysteryData has key {
        last_prize: u8,
    }

    // --- 3D Games ---
    struct TreasureData has key {
        chests_opened: u64,
        last_reward: u8,
        collection: vector<u8>,
    }

    struct RacingData has key {
        races_played: u64,
        wins: u64,
        last_vehicle: u8,
    }

    struct TimeRiftData has key {
        runs: u64,
        best_time: u64,
        last_seed: u64,
    }

    struct BattleRoyaleData has key {
        matches: u64,
        wins: u64,
        last_skin: u8,
    }
    
    // --- 🆕 New 2D Games ---
    struct TicTacToeData has key {
        wins: u64,
        losses: u64,
        draws: u64,
    }

    struct HangmanData has key {
        wins: u64,
    }

    struct MemoryMatchData has key {
        games_won: u64,
        best_moves: u64, // Lower is better
    }

    struct FlappyCloneData has key {
        high_score: u64,
        games_played: u64,
    }


    // === Main Storage Object ===
    struct GameStorage has key {
        // Original Tables
        dice_table: Table<address, DiceData>,
        rps_table: Table<address, RPSData>,
        snake_table: Table<address, SnakeData>,
        mystery_table: Table<address, MysteryData>,
        
        // 3D Game Tables
        treasure_table: Table<address, TreasureData>,
        racing_table: Table<address, RacingData>,
        time_rift_table: Table<address, TimeRiftData>,
        battle_royale_table: Table<address, BattleRoyaleData>,

        // --- 🆕 New 2D Game Tables ---
        tictactoe_table: Table<address, TicTacToeData>,
        hangman_table: Table<address, HangmanData>,
        memory_table: Table<address, MemoryMatchData>,
        flappy_table: Table<address, FlappyCloneData>,
    }

    public entry fun init(account: &signer) {
        move_to(account, GameStorage {
            // Original
            dice_table: table::new(),
            rps_table: table::new(),
            snake_table: table::new(),
            mystery_table: table::new(),
            // 3D
            treasure_table: table::new(),
            racing_table: table::new(),
            time_rift_table: table::new(),
            battle_royale_table: table::new(),
            // --- 🆕 New 2D ---
            tictactoe_table: table::new(),
            hangman_table: table::new(),
            memory_table: table::new(),
            flappy_table: table::new(),
        });
    }

    // === 🆕 NEW 2D GAME METHODS ===

    // --- Tic-Tac-Toe ---
    public entry fun record_tictactoe_game(account: &signer, result: u8) acquires GameStorage {
        // result: 0 = win, 1 = loss, 2 = draw
        assert!(result <= 2, 101);
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.tictactoe_table, addr)) {
            table::borrow_mut(&mut storage.tictactoe_table, addr)
        } else {
            let new_data = TicTacToeData { wins: 0, losses: 0, draws: 0 };
            table::add(&mut storage.tictactoe_table, addr, new_data);
            table::borrow_mut(&mut storage.tictactoe_table, addr)
        };
        if (result == 0) data.wins = data.wins + 1;
        else if (result == 1) data.losses = data.losses + 1;
        else data.draws = data.draws + 1;
    }

    // --- Hangman ---
    public entry fun record_hangman_win(account: &signer) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.hangman_table, addr)) {
            table::borrow_mut(&mut storage.hangman_table, addr)
        } else {
            let new_data = HangmanData { wins: 0 };
            table::add(&mut storage.hangman_table, addr, new_data);
            table::borrow_mut(&mut storage.hangman_table, addr)
        };
        data.wins = data.wins + 1;
    }
    
    // --- Memory Match ---
    public entry fun record_memory_match_win(account: &signer, moves: u64) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.memory_table, addr)) {
            table::borrow_mut(&mut storage.memory_table, addr)
        } else {
            // best_moves = 0 indicates no score set yet
            let new_data = MemoryMatchData { games_won: 0, best_moves: 0 };
            table::add(&mut storage.memory_table, addr, new_data);
            table::borrow_mut(&mut storage.memory_table, addr)
        };
        data.games_won = data.games_won + 1;
        if (data.best_moves == 0 || moves < data.best_moves) {
            data.best_moves = moves;
        }
    }
    
    // --- Flappy Clone ---
    public entry fun record_flappy_score(account: &signer, score: u64) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.flappy_table, addr)) {
            table::borrow_mut(&mut storage.flappy_table, addr)
        } else {
            let new_data = FlappyCloneData { high_score: 0, games_played: 0 };
            table::add(&mut storage.flappy_table, addr, new_data);
            table::borrow_mut(&mut storage.flappy_table, addr)
        };
        data.games_played = data.games_played + 1;
        if (score > data.high_score) {
            data.high_score = score;
        }
    }


    // === EXISTING GAME METHODS (UNCHANGED) ===

    // === Treasure Hunt 3D ===
    public entry fun open_treasure_chest(account: &signer, reward: u8, item_id: u8) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.treasure_table, addr)) {
            table::borrow_mut(&mut storage.treasure_table, addr)
        } else {
            let new_data = TreasureData { chests_opened: 0, last_reward: 0, collection: vector::empty<u8>() };
            table::add(&mut storage.treasure_table, addr, new_data);
            table::borrow_mut(&mut storage.treasure_table, addr)
        };
        data.chests_opened = data.chests_opened + 1;
        data.last_reward = reward;
        vector::push_back(&mut data.collection, item_id);
    }
    public fun get_treasure_data(addr: address): &TreasureData acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        table::borrow(&storage.treasure_table, addr)
    }

    // === Racing 3D ===
    public entry fun record_race(account: &signer, win: bool, vehicle: u8) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.racing_table, addr)) {
            table::borrow_mut(&mut storage.racing_table, addr)
        } else {
            let new_data = RacingData { races_played: 0, wins: 0, last_vehicle: 0 };
            table::add(&mut storage.racing_table, addr, new_data);
            table::borrow_mut(&mut storage.racing_table, addr)
        };
        data.races_played = data.races_played + 1;
        if (win) data.wins = data.wins + 1;
        data.last_vehicle = vehicle;
    }
    public fun get_racing_data(addr: address): &RacingData acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        table::borrow(&storage.racing_table, addr)
    }

    // === Time Rift Bike Racer ===
    public entry fun record_time_rift_run(account: &signer, time: u64, seed: u64) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.time_rift_table, addr)) {
            table::borrow_mut(&mut storage.time_rift_table, addr)
        } else {
            let new_data = TimeRiftData { runs: 0, best_time: 0, last_seed: 0 };
            table::add(&mut storage.time_rift_table, addr, new_data);
            table::borrow_mut(&mut storage.time_rift_table, addr)
        };
        data.runs = data.runs + 1;
        if (data.best_time == 0 || time < data.best_time) data.best_time = time;
        data.last_seed = seed;
    }
    public fun get_time_rift_data(addr: address): &TimeRiftData acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        table::borrow(&storage.time_rift_table, addr)
    }

    // === Battle Royale Survival ===
    public entry fun record_battle_royale(account: &signer, win: bool, skin: u8) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let data = if (table::contains(&storage.battle_royale_table, addr)) {
            table::borrow_mut(&mut storage.battle_royale_table, addr)
        } else {
            let new_data = BattleRoyaleData { matches: 0, wins: 0, last_skin: 0 };
            table::add(&mut storage.battle_royale_table, addr, new_data);
            table::borrow_mut(&mut storage.battle_royale_table, addr)
        };
        data.matches = data.matches + 1;
        if (win) data.wins = data.wins + 1;
        data.last_skin = skin;
    }
    public fun get_battle_royale_data(addr: address): &BattleRoyaleData acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        table::borrow(&storage.battle_royale_table, addr)
    }

    // === Dice Roll Game Methods ===
    public entry fun dice_roll(account: &signer, value: u8) acquires GameStorage {
        assert!(value >= 1 && value <= 6, 1);
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let dice_data = if (table::contains(&storage.dice_table, addr)) {
            table::borrow_mut(&mut storage.dice_table, addr)
        } else {
            let new_data = DiceData { rolls: vector::empty<u8>(), score: 0 };
            table::add(&mut storage.dice_table, addr, new_data);
            table::borrow_mut(&mut storage.dice_table, addr)
        };
        vector::push_back(&mut dice_data.rolls, value);
        dice_data.score = dice_data.score + (value as u64);
    }
    public fun get_dice_score(addr: address): u64 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.dice_table, addr)) { table::borrow(&storage.dice_table, addr).score } else { 0 }
    }
    public fun get_dice_rolls(addr: address): vector<u8> acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.dice_table, addr)) { vector::clone(&table::borrow(&storage.dice_table, addr).rolls) } else { vector::empty<u8>() }
    }

    // === Rock Paper Scissors Methods ===
    public entry fun play_rps(account: &signer, choice: u8) acquires GameStorage {
        assert!(choice <= 2, 2);
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let contract_choice = 1;
        let result = if (choice == contract_choice) { 0 } else if ((choice == 0 && contract_choice == 2) || (choice == 1 && contract_choice == 0) || (choice == 2 && contract_choice == 1)) {
            1
        } else { 2 };
        let rps_data = RPSData { choice, result };
        if (table::contains(&storage.rps_table, addr)) { table::remove(&mut storage.rps_table, addr); };
        table::add(&mut storage.rps_table, addr, rps_data);
    }
    public fun get_rps_result(addr: address): u8 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.rps_table, addr)) { table::borrow(&storage.rps_table, addr).result } else { 0 }
    }

    // === Snake & Ladder Methods ===
    const SNAKES_AND_LADDERS: vector<(u8, u8)> = vector[
        (16, 6), (47, 26), (49, 11), (56, 53), (62, 19), (64, 60), (87, 24), (93, 73), 
        (95, 75), (98, 78), (1, 38), (4, 14), (9, 31), (21, 42), (28, 84), (36, 44), (51, 67), (71, 91), (80, 100)
    ];
    public fun find_snake_ladder(pos: u8, idx: u64): u8 { if (idx >= vector::length(&SNAKES_AND_LADDERS)) { pos } else { let (start, end) = *vector::borrow(&SNAKES_AND_LADDERS, idx);
    if (start == pos) { end } else { find_snake_ladder(pos, idx + 1) } } }
    public entry fun init_snake(account: &signer) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        if (!table::contains(&storage.snake_table, addr)) { table::add(&mut storage.snake_table, addr, SnakeData { position: 1 });
        }
    }
    public entry fun move_snake(account: &signer, steps: u8) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let snake_data = if (table::contains(&storage.snake_table, addr)) { table::borrow_mut(&mut storage.snake_table, addr) } else { table::add(&mut storage.snake_table, addr, SnakeData { position: 1 });
        table::borrow_mut(&mut storage.snake_table, addr) };
        let temp_pos = snake_data.position + steps;
        let new_pos = if (temp_pos > 100) { snake_data.position } else { find_snake_ladder(temp_pos, 0) };
        snake_data.position = new_pos;
    }
    public fun get_snake_position(addr: address): u8 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.snake_table, addr)) { table::borrow(&storage.snake_table, addr).position } else { 1 }
    }

    // === Mystery Box Methods ===
    public entry fun open_mystery_box(account: &signer) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let prize_index = 0;
        let mystery_data = MysteryData { last_prize: prize_index };
        if (table::contains(&storage.mystery_table, addr)) { table::remove(&mut storage.mystery_table, addr);
        }
        table::add(&mut storage.mystery_table, addr, mystery_data);
    }
    public fun get_mystery_prize(addr: address): u8 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.mystery_table, addr)) { table::borrow(&storage.mystery_table, addr).last_prize } else { 255 }
    }
}