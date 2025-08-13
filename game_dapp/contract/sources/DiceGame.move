module GameDapp::Games {
    use std::signer;
    use std::table;
    use std::vector;

    // === Dice Roll Game State ===
    struct DiceData has key {
        rolls: vector<u8>,
        score: u64,
    }

    // === RPS Game State ===
    struct RPSData has key {
        choice: u8, // 0=rock,1=paper,2=scissors
        result: u8, // 0=draw,1=win,2=lose
    }

    // === Snake & Ladder State ===
    struct SnakeData has key {
        position: u8,
    }

    // === Mystery Box State ===
    struct MysteryData has key {
        last_prize: u8,
    }

    // Tables to store per-player data
    struct GameStorage has key {
        dice_table: table::Table<address, DiceData>,
        rps_table: table::Table<address, RPSData>,
        snake_table: table::Table<address, SnakeData>,
        mystery_table: table::Table<address, MysteryData>,
    }

    public entry fun init(account: &signer) {
        move_to(account, GameStorage {
            dice_table: table::new(),
            rps_table: table::new(),
            snake_table: table::new(),
            mystery_table: table::new(),
        });
    }

    // === Dice Roll Game Methods ===
    public entry fun dice_roll(account: &signer, value: u8) acquires GameStorage {
        assert!(value >= 1 && value <= 6, 1);
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);

        let dice_data = if (table::contains(&storage.dice_table, addr)) {
            table::borrow_mut(&mut storage.dice_table, addr)
        } else {
            let new_data = DiceData {
                rolls: vector::empty<u8>(),
                score: 0,
            };
            table::add(&mut storage.dice_table, addr, new_data);
            table::borrow_mut(&mut storage.dice_table, addr)
        };

        vector::push_back(&mut dice_data.rolls, value);
        dice_data.score = dice_data.score + (value as u64);
    }

    public fun get_dice_score(addr: address): u64 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.dice_table, addr)) {
            table::borrow(&storage.dice_table, addr).score
        } else {
            0
        }
    }

    public fun get_dice_rolls(addr: address): vector<u8> acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.dice_table, addr)) {
            vector::clone(table::borrow(&storage.dice_table, addr).rolls)
        } else {
            vector::empty<u8>()
        }
    }

    // === Rock Paper Scissors Methods ===
    public entry fun play_rps(account: &signer, choice: u8) acquires GameStorage {
        assert!(choice <= 2, 2);
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);

        // Fake random choice: always 1 (paper)
        let contract_choice = 1;

        let result = if (choice == contract_choice) {
            0 // draw
        } else if (
            (choice == 0 && contract_choice == 2) ||
            (choice == 1 && contract_choice == 0) ||
            (choice == 2 && contract_choice == 1)
        ) {
            1 // win
        } else {
            2 // lose
        };

        let rps_data = RPSData {
            choice,
            result,
        };

        if (table::contains(&storage.rps_table, addr)) {
            table::remove(&mut storage.rps_table, addr);
        }
        table::add(&mut storage.rps_table, addr, rps_data);
    }

    public fun get_rps_result(addr: address): u8 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.rps_table, addr)) {
            table::borrow(&storage.rps_table, addr).result
        } else {
            0
        }
    }

    // === Snake & Ladder Constants ===
    const SNAKES_AND_LADDERS: vector<(u8, u8)> = vector[
        (16, 6), (47, 26), (49, 11), (56, 53), (62, 19),
        (64, 60), (87, 24), (93, 73), (95, 75), (98, 78),
        (1, 38), (4, 14), (9, 31), (21, 42), (28, 84),
        (36, 44), (51, 67), (71, 91), (80, 100)
    ];

    // Recursive helper function to find snake or ladder destination
    public fun find_snake_ladder(pos: u8, idx: u64): u8 {
        if (idx >= vector::length(&SNAKES_AND_LADDERS)) {
            pos
        } else {
            let (start, end) = *vector::borrow(&SNAKES_AND_LADDERS, idx);
            if (start == pos) {
                end
            } else {
                find_snake_ladder(pos, idx + 1)
            }
        }
    }

    public entry fun init_snake(account: &signer) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        if (!table::contains(&storage.snake_table, addr)) {
            table::add(&mut storage.snake_table, addr, SnakeData { position: 1 });
        }
    }

    public entry fun move_snake(account: &signer, steps: u8) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);
        let snake_data = if (table::contains(&storage.snake_table, addr)) {
            table::borrow_mut(&mut storage.snake_table, addr)
        } else {
            table::add(&mut storage.snake_table, addr, SnakeData { position: 1 });
            table::borrow_mut(&mut storage.snake_table, addr)
        };

        let temp_pos = snake_data.position + steps;

        let new_pos = if (temp_pos > 100) {
            snake_data.position
        } else {
            find_snake_ladder(temp_pos, 0)
        };

        snake_data.position = new_pos;
    }

    public fun get_snake_position(addr: address): u8 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.snake_table, addr)) {
            table::borrow(&storage.snake_table, addr).position
        } else {
            1
        }
    }

    // === Mystery Box Methods ===
    const PRIZES: vector<u8> = vector[0, 1, 2, 3, 4]; // index representing different prizes

    public entry fun open_mystery_box(account: &signer) acquires GameStorage {
        let addr = signer::address_of(account);
        let storage = borrow_global_mut<GameStorage>(addr);

        // Fake random prize: always prize index 0
        let prize_index = 0;

        let mystery_data = MysteryData { last_prize: prize_index };

        if (table::contains(&storage.mystery_table, addr)) {
            table::remove(&mut storage.mystery_table, addr);
        }
        table::add(&mut storage.mystery_table, addr, mystery_data);
    }

    public fun get_mystery_prize(addr: address): u8 acquires GameStorage {
        let storage = borrow_global<GameStorage>(addr);
        if (table::contains(&storage.mystery_table, addr)) {
            table::borrow(&storage.mystery_table, addr).last_prize
        } else {
            255 // no prize
        }
    }
}
