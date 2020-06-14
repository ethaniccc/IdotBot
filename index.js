require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const sqlite3 = require('sqlite3').verbose();
const PLAN_IDS = {
    FREE:0,
}
const STARTER_CONST = {
    plan: PLAN_IDS.FREE,
    balance: 0,
    currentBank: 0,
    maxBank: 100
}
const BEG_SUCCESS_MESSAGES = [
    "A rich man looked at you with pity and gave you $",
    "Your mom looked at you and laughed wickedly, but while leaving, she dropped $",
    "Your dad looked at you with disaproval and he threw money at you. Precisely $",
    "The IdotBot god blesses you with $"
];
const BEG_FAIL_MESSAGES = [
    "Although you pleaded for money, nobody gave you any.",
    "You, being the idiot you are, decided to beg for money in a town full of poverty.",
    "Nobody likes you and as a result, you got no money."
];
var commands = [
    ".help", ".balance", ".bal", ".beg", ".deposit", ".dep", ".withdraw", ".with",
    ".gamble", ".bet", ".daily", ".weekly", ".backup", ".restart", ".stop", ".pay",
    ".ram"
];
var commandCooldown = [];
var begCooldown = [];
var betCooldown = [];
var payCooldown = [];

bot.login(TOKEN);

db = new sqlite3.Database("UserData.db", function  (err){
    if(err){
        return console.error(err.message);
    }
});


function getRandomInt(min, max){
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

bot.on('ready', function(){
    console.log("IdotBot has been successfully enabled!");
    db.run("CREATE TABLE IF NOT EXISTS userData (id STRING PRIMARY KEY, balance INT, currentBank INT, maxBank INT);");
    db.run("CREATE TABLE IF NOT EXISTS dailyCooldown (id STRING PRIMARY KEY, time INT);");
    db.run("CREATE TABLE IF NOT EXISTS weeklyCooldown (id STRING PRIMARY KEY, time INT);");
    console.log("Database has been successfully prepared!");
});

bot.on('message', message => {
    /* Command detection */
    senderID = (message.author.id).toString();
    senderName = message.author.username;
    if(message.content.charAt(0) == "."){
        if(!commands.includes(message.content.split(" ")[0])){
            return;
        }
        if(commandCooldown[senderID] === NaN || commandCooldown[senderID] === undefined){
            commandCooldown[senderID] = Date.now();
        } else {
            if(Date.now() - commandCooldown[senderID] >= 2500){
                commandCooldown[senderID] = Date.now();
            } else {
                message.channel.send("You are still in cooldown, you must wait `" + Math.round((2.5 - (Date.now() - commandCooldown[senderID]) / 1000)) + "` seconds to use commands again!");
                return;
            }
        }
    }
    switch(message.content.split(" ")[0]){
        case ".restart":
            if(senderID == "590876357085495321"){
                message.channel.send("Bot requested a restart. Restarting...");
                bot.destroy();
                console.log("Bot has been shut down, a restart was requested by ethaniccc.");
                bot.login(TOKEN);
            }
        break;
        case ".stop":
            if(senderID == "590876357085495321"){
                message.channel.send("At your request ethaniccc, I will kill myself.");
                bot.destroy();
                console.log("Ethaniccc has requested to stop the bot.");
            }
        break;
        case ".help":
            message.channel.send("**Current commands:** " + commands);
        break;
        case ".balance":
        case ".bal":
            if(message.content.split(" ")[1] !== undefined){
                targetID = message.content.split(" ")[1];
                if(targetID.includes("<@")) targetID = targetID.split("<@")[1].split(">")[0]
                db.get("SELECT * FROM userData WHERE id = ?;", targetID, function(error, row){
                    if(error) console.error(error.message);
                    return row ? message.channel.send({embed: {
                        color: 3447003,
                        title: "Balance of " + targetID,
                        description: "Wallet: $" + row.balance + "\nBank: $" + row.currentBank + "/$" + row.maxBank 
                    }}) : message.channel.send("The specified user is not using PepperoniCraft");
                });
                return;
            }
            db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                if(error) console.error(error.message);
                return row ? message.channel.send({embed: {
                    color: 3447003,
                    title: "Balance of " + senderName,
                    description: "Wallet: $" + row.balance + "\nBank: $" + row.currentBank + "/$" + row.maxBank 
                }}) : db.run("INSERT INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                    if(error) console.error(error.message);
                    console.log("Account for " + senderID + " has been created!");
                    db.get("SELECT * FROM userData where id = ?;", senderID, function(error, row){
                        if(error) console.error(error.message);
                        return row ? message.channel.send({embed: {
                            color: 3447003,
                            title: "Balance of " + senderName,
                            description: "Wallet: $" + row.balance + "\nBank: $" + row.currentBank + "/$" + row.maxBank 
                        }}) : null;
                    });
                });
            });
        break;
        case ".beg":
            //1 second is 1000, so 30 seconds is 30000
            if(begCooldown[senderID] === undefined){
                begCooldown[senderID] = Date.now();
            } else {
                if(Date.now() - begCooldown[senderID] >= 30000){
                    begCooldown[senderID] = Date.now();
                } else {
                    message.channel.send("Please stop begging, you must wait **`" + Math.round((30 - (Date.now() - begCooldown[senderID]) / 1000)) + "`** seconds until you can beg again!");
                    return;
                }
            }
            chance = getRandomInt(0, 150) % 2;
            if(chance != 0){
                message.channel.send(BEG_FAIL_MESSAGES[getRandomInt(0, 2)]);
                return;
            }
            randomAmount = getRandomInt(1, 50);
            db.get("SELECT * FROM userData WHERE id = ?", senderID, function(error, row){
                if(error) console.error(error.message);
                return row ? db.get("SELECT * FROM userData where id = ?;", senderID, function(error, row){
                    if(error) console.error(error.message);
                    currentBalance = row.balance;
                    newBalance = currentBalance + randomAmount;
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank)", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                        if(error) console.error(error.message);
                        message.channel.send(BEG_SUCCESS_MESSAGES[getRandomInt(0, 3)] + randomAmount);
                    });
                }) : db.run("INSERT INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                    if(error) console.error(error.message);
                    console.log("Account for " + senderID + " has been created!");
                    db.get("SELECT * FROM userData where id = ?;", senderID, function(error, row){
                        if(error) console.error(error.message);
                        currentBalance = row.balance;
                        newBalance = currentBalance + randomAmount;
                        db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank)", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                            if(error) console.error(error.message);
                            message.channel.send(BEG_SUCCESS_MESSAGES[getRandomInt(0, 3)] + randomAmount);
                        });
                    });
                });
            });
        break;
        case ".deposit":
        case ".dep":
            if(message.content.split(" ")[1] === undefined){
                message.channel.send("You need to define an amount to deposit into your bank.");
                return;
            }
            moneyToDeposit = message.content.split(" ")[1];
            db.get("SELECT * FROM userData WHERE id = ?", senderID, function(error, row){
                if(error) console.error(error.message);
                if(row === undefined){
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                        if(error) console.error(error.message);
                        console.log("Account for " + senderID + " has been created.")
                    });
                }
                if(moneyToDeposit == "all") moneyToDeposit = row.balance;
                else if(!/^\d+$/.test(moneyToDeposit)){
                    message.channel.send("You can't deposit whatever that was.");
                    return;
                }
                if(moneyToDeposit > row.balance){
                    message.channel.send("You are attempting to deposit more than you have. Intresting.");
                } else {
                    if(row.currentBank + moneyToDeposit > row.maxBank){
                        moneyToDeposit = row.maxBank - row.currentBank;
                    }
                    newBalance = row.balance - moneyToDeposit;
                    newBank = row.currentBank + moneyToDeposit;
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, newBank, row.maxBank], function(error){
                        if(error) console.error(error.message);
                        message.channel.send("$" + moneyToDeposit + " has been deposited into your bank.");
                    });
                }
            });
        break;
        case ".withdraw":
        case ".with":
            db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                if(error) console.error(error.message);
                if(row === undefined){
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                        if(error) console.error(error.message);
                        console.log("Account for " + senderID + " has been created.")
                    });
                }
                moneyToWidthdraw =  message.content.split(" ")[1];
                if(moneyToWidthdraw > row.currentBank){
                    message.channel.send("You are attempting to withdraw more than you have in your bank. Intresting.");
                    return;
                }
                if(moneyToWidthdraw == "all") moneyToWidthdraw = row.currentBank;
                else if(!/^\d+$/.test(moneyToWidthdraw)){
                    message.channel.send("You can't withdraw whatever that was.");
                    return;
                }
                newBank = row.currentBank - moneyToWidthdraw;
                newBalance = row.balance + moneyToWidthdraw;
                db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, newBank, row.maxBank], function(error){
                    if(error) console.error(error.message);
                });
            });
        break;
        case ".bet":
        case ".gamble":
            if(betCooldown[senderID] === undefined || betCooldown[senderID] === NaN){
                betCooldown[senderID] = Date.now();
            } else {
                if(Date.now() - betCooldown[senderID] >= 5000){
                    betCooldown[senderID] = Date.now();
                } else {
                    message.channel.send("Please stop being a gamble addict! You must wait **`" + Math.round((5 - (Date.now() - betCooldown[senderID]) / 1000)) + "`** seconds until you can bet again!");
                    return;
                }
            }
            db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                if(error) console.error(error.message);
                if(row == undefined){
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                        if(error) console.error(error.message);
                    });
                    message.channel.send("Please re-run this command.");
                    return;
                }
                amountToGamble = message.content.split(" ")[1];
                if(amountToGamble == "all") amountToGamble = row.balance;
                else if(!/^\d+$/.test(amountToGamble)){
                    message.channel.send("You can't gamble whatever that was.");
                    return;
                }
                if(amountToGamble > row.balance){
                    message.channel.send("You are attempting to bet more than you have.");
                    return;
                }
                chance = getRandomInt(0, 100) % 2;
                if(chance != 0){
                    newBalance = row.balance - amountToGamble;
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                        if(error) console.error(error.messgage);
                    });
                    message.channel.send({embed: {
                        color: 15158332,
                        title: "Oh no!",
                        description: "You lost the bet, and the $" + amountToGamble + " you betted with it. Your balance is now $" + newBalance
                    }});
                } else {
                    newBalance = parseInt(+row.balance + (amountWon = +amountToGamble * getRandomInt(1, 1.5)));
                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                        if(error) console.error(error.message);
                    });
                    message.channel.send({embed: {
                        color: 3066993,
                        title: "Congrats!",
                        description: "You won $" + amountWon + "! Your balance is now $" + newBalance
                    }});
                }
            });
        break;
        case ".daily":
            db.get("SELECT * FROM dailyCooldown WHERE id = ?;", senderID, function(error, row){
                if(error) console.error(error.message);
                if(row == undefined){
                    dailyAmount = getRandomInt(100, 1000);
                    db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                        if(error) console.error(error.message);
                        if(row == undefined){
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                                if(error) console.error(error.message);
                                db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                                    newBalance = (+row.balance) + (+dailyAmount);
                                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                                        if(error) console.error(error.message);
                                        message.channel.send("You get a random daily bonus of $" + dailyAmount + " and you now have a balance of $" + newBalance + "! Be sure to come back daily to get a reward!");
                                    });
                                });
                            });
                        } else {
                            newBalance = (+row.balance) + (+dailyAmount);
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                                if(error) console.error(error.message);
                                message.channel.send("You get a random daily bonus of $" + dailyAmount + " and you now have a balance of $" + newBalance + "! Be sure to come back daily to get a reward!");
                            });
                        }
                    });
                    db.run("INSERT OR REPLACE INTO dailyCooldown (id, time) VALUES (:id, :time);", [senderID, Date.now()], function(error){
                        if(error) console.error(error.message);
                    });
                } else {
                    timeCooldown = ((24 * 60 * 60) * 1000);
                    if(Date.now() - row.time >= timeCooldown){
                        dailyAmount = getRandomInt(100, 1000);
                        db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                            if(error) console.error(error.message);
                            newBalance = (+row.balance) + (+dailyAmount);
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                                if(error) console.error(error.message);
                                message.channel.send("You get a random daily bonus of $" + dailyAmount + " and you now have a balance of $" + newBalance + "! Be sure to come back daily to get a reward!");
                            });
                        });
                    } else {
                        message.channel.send({embed: {
                            color: 10038562,
                            title: "Uh oh spagettio!",
                            description: "It appears that you already claimed your daily reward, please come back in " + (24 - (Math.round(((timeCooldown - (Date.now() - row.time)) / (1000 * 60 * 60 * 24))))) + " hours!"
                        }});
                    }
                }
            });
        break;
        case ".weekly":
            db.get("SELECT * FROM weeklyCooldown WHERE id = ?;", senderID, function(error, row){
                if(error) console.log(error.message);
                if(row == undefined){
                    weeklyAmount = getRandomInt(1000, 10000);
                    db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                        if(error) console.error(error.message);
                        if(row == undefined){
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, STARTER_CONST.balance, STARTER_CONST.currentBank, STARTER_CONST.maxBank], function(error){
                                if(error) console.error(error.message);
                                db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                                    newBalance = (+row.balance) + (+weeklyAmount);
                                    db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                                        if(error) console.error(error.message);
                                        message.channel.send("You get a random daily bonus of $" + weeklyAmount + " and you now have a balance of $" + newBalance + "! Be sure to come back daily to get a reward!");
                                    });
                                });
                            });
                        } else {
                            newBalance = (+row.balance) + (+weeklyAmount);
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                                if(error) console.error(error.message);
                                message.channel.send("You get a random daily bonus of $" + weeklyAmount + " and you now have a balance of $" + newBalance + "! Be sure to come back daily to get a reward!");
                            });
                        }
                    });
                    db.run("INSERT OR REPLACE INTO weeklyCooldown (id, time) VALUES (:id, :time);", [senderID, Date.now()], function(error){
                        if(error) console.error(error.message);
                    });
                } else {
                    timeCooldown = ((7 * 24 * 60 * 60) * 1000);
                    if(Date.now() - row.time >= timeCooldown){
                        weeklyAmount = getRandomInt(1000, 10000);
                        db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                            if(error) console.error(error.message);
                            newBalance = (+row.balance) + (+weeklyAmount);
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                                if(error) console.error(error.message);
                                message.channel.send("You get a random weekly bonus of $" + weeklyAmount + " and you now have a balance of $" + newBalance + "! Be sure to come back daily to get a reward!");
                            });
                        });
                    } else {
                        message.channel.send({embed: {
                            color: 10038562,
                            title: "Uh oh spagettio!",
                            description: "It appears that you already claimed your huge weekly reward, please come back in " + ((24 * 7) - (Math.round(((timeCooldown - (Date.now() - row.time)) / (1000 * 60 * 60 * 24 * 7))))) + " hours!"
                        }});
                    }
                }
            });
        break;
        case ".backup":
            if(senderID == "590876357085495321" || senderID == "387336581775884288"){
                backupDatabase = new sqlite3.Database("UserBackups.db", function  (err){
                    if(err){
                        return console.error(err.message);
                    }
                });
                backupDatabase.run("CREATE TABLE IF NOT EXISTS dataSave (id STRING PRIMARY KEY, balance INT, currentBank INT, maxBank INT)");
                type = message.content.split(" ")[1];
                switch(type){
                    case "create":
                        startTime = Date.now();
                        db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                            if(error) console.error(error.message);
                            if(row === undefined) message.channel.send("You have no information to back up.");
                            else {
                                backupDatabase.run("INSERT OR REPLACE INTO dataSave (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, row.balance, row.currentBank, row.maxBank], function(error){
                                    if(error) console.error(error.message);
                                    message.channel.send("Your data has been backed up in " + ((Date.now() - startTime) / 1000) + " seconds!");
                                });
                            }
                        });
                    break;
                    case "restore":
                        startTime = Date.now();
                        backupDatabase.get("SELECT * FROM dataSave WHERE id = ?;", senderID, function(error, row){
                            if(error) console.error(error.message);
                            if(row == undefined){
                                message.channel.send("There is no data to restore.");
                            }
                            db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, row.balance, row.currentBank, row.maxBank], function(error){
                                if(error) console.error(error.message);
                                message.channel.send("Your data has been restored from the database.");
                            });
                        });
                    break;
                }
            } else {
                message.channel.send("This command is still under development.");
            }
        break;
        case ".pay":
            if(message.content.split(" ")[1] == undefined){
                message.channel.send("You need to specify a user you want to pay money.");
            } else if(message.content.split(" ")[2] == undefined || isNaN(message.content.split(" ")[2])){
                message.channel.send("You need to specify an amount you want to pay the user.");
            } else {
                userToPay = message.content.split(" ")[1];
                if(userToPay.includes("<@") && userToPay.includes(">")){
                    userToPay = userToPay.split("<@")[1].split(">")[0];
                }
                if(userToPay == senderID){
                    message.channel.send("You can't send money to yourself.");
                    return;
                }
                db.get("SELECT * FROM userData WHERE id = ?;", senderID, function(error, row){
                    if(error) console.error(error.message);
                    if(row == undefined){
                        message.channel.send("You have no money to pay anybody.");
                        return;
                    }
                    amountToPay = message.content.split(" ")[2];
                    if(amountToPay == "all") amountToPay = row.balance;
                    else if(!/^\d+$/.test(amountToPay)){
                        message.channel.send("You can't pay that person whatever that was.");
                        return;
                    }
                    if(amountToPay > row.balance){
                        message.channel.send("You can't pay somebody more than what you have.");
                    } else {
                        newPayerBalance = row.balance - amountToPay;
                        db.get("SELECT * FROM userData WHERE id = ?;", userToPay, function(error, row){
                            if(error) console.log(error.message);
                            if(row == undefined){
                                message.channel.send("This user is not affiliated with IdotBot.");
                            } else {
                                newPaidBalance = +row.balance + +amountToPay;
                                db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [userToPay, newPaidBalance, row.currentBank, row.maxBank], function(error){
                                    if(error) console.log(error);
                                });
                            }
                        });
                        db.run("INSERT OR REPLACE INTO userData (id, balance, currentBank, maxBank) VALUES (:id, :balance, :currentBank, :maxBank);", [senderID, newPayerBalance, row.currentBank, (row.maxBank + getRandomInt(0, 5))], function(error){
                            if(error) console.log(error.message);
                            message.channel.send("You have paid the user $" + amountToPay + "!");
                        });
                    }
                });
            }
        break;
        case ".ram":
            message.channel.send((process.memoryUsage().heapUsed / 1024 / 1024) + "MB");
        break;
    }
});