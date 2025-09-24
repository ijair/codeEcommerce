// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/contracts/ITCToken20.sol";

/**
 * @title ITCToken20Test
 * @dev Comprehensive test suite for ITCToken20 contract
 */
contract ITCToken20Test is Test {
    // Allow this contract to receive ETH
    receive() external payable {}
    ITCToken20 public token;
    address public owner;
    address public user1;
    address public user2;
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**18; // Full max supply minted to owner
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant TOKEN_PRICE = 0.001 ether;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethAmount);
    event TokensWithdrawn(address indexed seller, uint256 amount, uint256 ethAmount);
    event TokensBurned(address indexed burner, uint256 amount, uint256 burnId, uint256 timestamp, uint256 totalBurned);
    event TokenPriceUpdated(uint256 newPrice);

    function setUp() public {
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        token = new ITCToken20(owner);
        
        // Fund users with ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    function testInitialState() public {
        assertEq(token.name(), "ITC Token");
        assertEq(token.symbol(), "ITC");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(owner), INITIAL_SUPPLY);
        assertEq(token.getTokenPrice(), TOKEN_PRICE);
        assertEq(token.getMaxSupply(), MAX_SUPPLY);
        assertEq(token.getRemainingSupply(), 0); // No remaining supply since all is minted
        
        // Test initial burn tracking state
        assertEq(token.getTotalBurnTransactions(), 0);
        assertEq(token.getTotalTokensBurned(), 0);
    }

    function testBuyTokens() public {
        uint256 ethAmount = 1 ether;
        uint256 expectedTokens = (ethAmount * 1e18) / TOKEN_PRICE;
        
        // Give user1 enough ETH
        vm.deal(user1, ethAmount);
        
        // Check owner has enough tokens
        uint256 ownerBalance = token.balanceOf(owner);
        require(ownerBalance >= expectedTokens, "Owner doesn't have enough tokens");
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        assertEq(token.balanceOf(user1), expectedTokens);
        assertEq(token.balanceOf(owner), ownerBalance - expectedTokens);
    }

    function testBuyTokensZeroETH() public {
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Amount must be greater than zero");
        token.buyTokens{value: 0}();
    }

    function testBuyTokensInsufficientOwnerBalance() public {
        // First, transfer all owner tokens to user2 to simulate insufficient balance
        uint256 ownerBalance = token.balanceOf(owner);
        token.transfer(user2, ownerBalance);
        
        uint256 ethAmount = 1 ether;
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Insufficient tokens available");
        token.buyTokens{value: ethAmount}();
    }


    function testWithdrawTokens() public {
        // First buy some tokens using new method
        uint256 ethAmount = 1 ether;
        uint256 expectedTokens = (ethAmount * 1e18) / TOKEN_PRICE;
        
        // Give user1 enough ETH
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        // Now withdraw half
        uint256 withdrawAmount = expectedTokens / 2;
        
        // Calculate expected withdrawal using the contract's calculation function
        (uint256 netAmount, , ) = token.calculateWithdrawTokensNet(withdrawAmount);
        
        uint256 initialBalance = user1.balance;
        
        vm.prank(user1);
        token.withdrawTokens(withdrawAmount);
        
        assertEq(token.balanceOf(user1), expectedTokens - withdrawAmount);
        // Allow small differences due to precision in fee calculations
        assertTrue(user1.balance >= initialBalance + netAmount - 1000);
        assertTrue(user1.balance <= initialBalance + netAmount + 1000);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - withdrawAmount); // Total supply decreases when tokens are withdrawn
    }

    function testWithdrawTokensInsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Insufficient token balance");
        token.withdrawTokens(1000 * 10**18);
    }

    function testWithdrawTokensZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Amount must be greater than zero");
        token.withdrawTokens(0);
    }

    function testWithdrawTokensInsufficientContractBalance() public {
        // Buy tokens first using new method
        uint256 ethAmount = 1 ether;
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        uint256 userTokens = token.balanceOf(user1);
        
        // Drain contract balance
        token.withdrawAllETH();
        
        // Try to withdraw tokens
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Insufficient contract balance");
        token.withdrawTokens(userTokens);
    }

    function testSetTokenPrice() public {
        uint256 newPrice = 0.002 ether;
        
        token.setTokenPrice(newPrice);
        
        assertEq(token.getTokenPrice(), newPrice);
    }

    function testSetTokenPriceZero() public {
        vm.expectRevert("ITCToken20: Price must be greater than zero");
        token.setTokenPrice(0);
    }

    function testSetTokenPriceNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setTokenPrice(0.002 ether);
    }

    function testMint() public {
        // First burn some tokens to make space for minting
        uint256 burnAmount = 10000 * 10**18;
        token.burn(owner, burnAmount);
        
        uint256 amount = 1000 * 10**18;
        
        token.mint(user1, amount);
        
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - burnAmount + amount);
    }

    function testMintExceedsMaxSupply() public {
        uint256 amount = MAX_SUPPLY; // Try to mint more than remaining supply
        
        vm.expectRevert("ITCToken20: Exceeds maximum supply");
        token.mint(user1, amount);
    }

    function testMintNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.mint(user2, 1000 * 10**18);
    }

    function testBurn() public {
        uint256 amount = 1000 * 10**18;
        
        // Transfer some tokens from owner to user1
        token.transfer(user1, amount);
        
        // Then burn them
        token.burn(user1, amount);
        
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), INITIAL_SUPPLY - amount);
    }

    function testBurnInsufficientBalance() public {
        vm.expectRevert("ITCToken20: Insufficient balance to burn");
        token.burn(user1, 1000 * 10**18);
    }

    function testBurnNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.burn(user2, 1000 * 10**18);
    }

    // ===== NEW TESTS FOR FULLFILL TOKENS =====

    function testFullFillTokens() public {
        // First burn some tokens to make space for minting
        uint256 burnAmount = 10000 * 10**18;
        token.burn(owner, burnAmount);
        
        uint256 ethAmount = 2 ether;
        uint256 expectedTokens = (ethAmount * 1e18) / TOKEN_PRICE;
        uint256 initialSupply = token.totalSupply();
        uint256 initialOwnerBalance = token.balanceOf(owner);
        
        // Owner sends ETH to mint tokens
        token.fullFillTokens{value: ethAmount}();
        
        // Check tokens were minted to owner
        assertEq(token.balanceOf(owner), initialOwnerBalance + expectedTokens);
        assertEq(token.totalSupply(), initialSupply + expectedTokens);
        
        // Check contract received ETH
        assertEq(address(token).balance, ethAmount);
    }

    function testFullFillTokensZeroETH() public {
        vm.expectRevert("ITCToken20: Amount must be greater than zero");
        token.fullFillTokens{value: 0}();
    }

    function testFullFillTokensNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.fullFillTokens{value: 1 ether}();
    }

    function testFullFillTokensExceedsMaxSupply() public {
        // Calculate ETH needed to exceed max supply
        uint256 remainingSupply = token.getRemainingSupply();
        uint256 excessTokens = remainingSupply + 1000 * 10**18;
        uint256 excessETH = (excessTokens * TOKEN_PRICE) / 1e18;
        
        vm.expectRevert("ITCToken20: Exceeds maximum supply");
        token.fullFillTokens{value: excessETH}();
    }

    function testCompleteWorkflowFullFillAndBuy() public {
        // First burn some tokens to make space for minting
        uint256 burnAmount = 50000 * 10**18;
        token.burn(owner, burnAmount);
        
        // Step 1: Owner fills more tokens
        uint256 ownerETH = 5 ether;
        uint256 expectedOwnerTokens = (ownerETH * 1e18) / TOKEN_PRICE;
        uint256 initialOwnerBalance = token.balanceOf(owner);
        
        token.fullFillTokens{value: ownerETH}();
        assertEq(token.balanceOf(owner), initialOwnerBalance + expectedOwnerTokens);
        
        // Step 2: User buys tokens from owner's balance
        uint256 userETH = 1 ether;
        uint256 expectedUserTokens = (userETH * 1e18) / TOKEN_PRICE;
        vm.deal(user1, userETH);
        
        uint256 ownerBalanceBeforeSale = token.balanceOf(owner);
        
        vm.prank(user1);
        token.buyTokens{value: userETH}();
        
        // Verify tokens were transferred from owner to user
        assertEq(token.balanceOf(user1), expectedUserTokens);
        assertEq(token.balanceOf(owner), ownerBalanceBeforeSale - expectedUserTokens);
        
        // Verify contract has both ETH amounts
        assertEq(address(token).balance, ownerETH + userETH);
    }

    function testWithdrawETH() public {
        // Buy some tokens to add ETH to contract
        uint256 ethAmount = 1 ether;
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        uint256 contractBalance = token.getContractBalance();
        assertTrue(contractBalance > 0);
        
        // Withdraw half
        uint256 withdrawAmount = contractBalance / 2;
        uint256 initialOwnerBalance = owner.balance;
        
        token.withdrawETH(withdrawAmount);
        
        assertEq(owner.balance, initialOwnerBalance + withdrawAmount);
        assertEq(token.getContractBalance(), contractBalance - withdrawAmount);
    }

    function testWithdrawAllETH() public {
        // Buy some tokens to add ETH to contract
        uint256 ethAmount = 1 ether;
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        uint256 contractBalance = token.getContractBalance();
        uint256 initialOwnerBalance = owner.balance;
        
        token.withdrawAllETH();
        
        assertEq(owner.balance, initialOwnerBalance + contractBalance);
        assertEq(token.getContractBalance(), 0);
    }

    function testWithdrawETHNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.withdrawETH(1 ether);
    }

    function testWithdrawAllETHNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.withdrawAllETH();
    }

    function testReceive() public {
        uint256 amount = 1 ether;
        
        (bool success,) = address(token).call{value: amount}("");
        assertTrue(success);
        assertEq(token.getContractBalance(), amount);
    }

    function testFallback() public {
        uint256 amount = 1 ether;
        
        (bool success,) = address(token).call{value: amount}("0x1234");
        assertTrue(success);
        assertEq(token.getContractBalance(), amount);
    }

    function testFuzzBuyTokens(uint256 ethAmount) public {
        vm.assume(ethAmount > 0);
        vm.assume(ethAmount <= 10 ether); // Reasonable limit
        
        uint256 expectedTokens = (ethAmount * 1e18) / TOKEN_PRICE;
        vm.assume(token.balanceOf(owner) >= expectedTokens); // Owner must have enough tokens
        
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        assertEq(token.balanceOf(user1), expectedTokens);
    }

    function testFuzzWithdrawTokens(uint256 ethAmount, uint256 withdrawAmount) public {
        // Use reasonable ranges
        ethAmount = bound(ethAmount, 0.1 ether, 5 ether);
        
        uint256 expectedTokens = (ethAmount * 1e18) / TOKEN_PRICE;
        withdrawAmount = bound(withdrawAmount, expectedTokens / 10, expectedTokens);
        
        vm.assume(token.balanceOf(owner) >= expectedTokens);
        
        // Skip if withdrawal amount is too small to cover fees
        try token.calculateWithdrawTokensNet(withdrawAmount) returns (uint256, uint256, uint256) {
            // Continue with test
        } catch {
            return; // Skip this test case
        }
        
        vm.deal(user1, ethAmount);
        
        // Buy tokens
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        // Withdraw tokens
        vm.prank(user1);
        token.withdrawTokens(withdrawAmount);
        
        assertEq(token.balanceOf(user1), expectedTokens - withdrawAmount);
    }

    function testFuzzSetTokenPrice(uint256 newPrice) public {
        vm.assume(newPrice > 0);
        
        token.setTokenPrice(newPrice);
        assertEq(token.getTokenPrice(), newPrice);
    }

    // ===== NEW TESTS FOR STRIPE FEES =====

    function testCalculateBuyTokensCost() public {
        uint256 tokenAmount = 100 * 10**18; // 100 tokens
        
        (uint256 totalCost, uint256 stripeFee, uint256 gasFee) = token.calculateBuyTokensCost(tokenAmount);
        
        uint256 tokenCost = (tokenAmount * TOKEN_PRICE) / 1e18; // Correct calculation
        uint256 expectedStripeFee = 0.0001 ether + (tokenCost * 290) / 10000; // Updated fixed fee + 2.9%
        uint256 expectedGasFee = 0.002 ether;
        uint256 expectedTotalCost = tokenCost + expectedStripeFee + expectedGasFee;
        
        assertEq(totalCost, expectedTotalCost);
        assertEq(stripeFee, expectedStripeFee);
        assertEq(gasFee, expectedGasFee);
    }

    function testCalculateWithdrawTokensNet() public {
        uint256 tokenAmount = 1000 * 10**18; // 1000 tokens (large enough to cover fees)
        
        (uint256 netAmount, uint256 stripeFee, uint256 gasFee) = token.calculateWithdrawTokensNet(tokenAmount);
        
        uint256 grossAmount = (tokenAmount * TOKEN_PRICE) / 1e18; // Correct calculation
        uint256 expectedStripeFee = 0.0001 ether + (grossAmount * 290) / 10000; // Updated fixed fee + 2.9%
        uint256 expectedGasFee = 0.002 ether;
        uint256 expectedNetAmount = grossAmount - expectedStripeFee - expectedGasFee;
        
        assertEq(netAmount, expectedNetAmount);
        assertEq(stripeFee, expectedStripeFee);
        assertEq(gasFee, expectedGasFee);
    }

    function testCalculateBuyTokensCostZeroAmount() public {
        vm.expectRevert("ITCToken20: Token amount must be greater than zero");
        token.calculateBuyTokensCost(0);
    }

    function testCalculateWithdrawTokensNetZeroAmount() public {
        vm.expectRevert("ITCToken20: Token amount must be greater than zero");
        token.calculateWithdrawTokensNet(0);
    }

    function testCalculateWithdrawTokensNetAmountTooSmall() public {
        uint256 tokenAmount = 1; // Very small amount
        
        vm.expectRevert("ITCToken20: Amount too small to cover fees");
        token.calculateWithdrawTokensNet(tokenAmount);
    }

    function testGetStripeFeeConfig() public {
        (uint256 fixedFee, uint256 percentageFee) = token.getStripeFeeConfig();
        
        assertEq(fixedFee, 0.0001 ether); // Updated to realistic value
        assertEq(percentageFee, 290); // 2.9%
    }

    function testGetGasFeeEstimate() public {
        uint256 gasFee = token.getGasFeeEstimate();
        assertEq(gasFee, 0.002 ether);
    }

    function testSetStripeFeeConfig() public {
        uint256 newFixedFee = 0.25 ether;
        uint256 newPercentageFee = 250; // 2.5%
        
        token.setStripeFeeConfig(newFixedFee, newPercentageFee);
        
        (uint256 fixedFee, uint256 percentageFee) = token.getStripeFeeConfig();
        assertEq(fixedFee, newFixedFee);
        assertEq(percentageFee, newPercentageFee);
    }

    function testSetStripeFeeConfigNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setStripeFeeConfig(0.25 ether, 250);
    }

    function testSetStripeFeeConfigPercentageTooHigh() public {
        vm.expectRevert("ITCToken20: Percentage fee too high (max 10%)");
        token.setStripeFeeConfig(0.30 ether, 1001); // 10.01%
    }

    function testSetGasFeeEstimate() public {
        uint256 newGasFee = 0.005 ether;
        
        token.setGasFeeEstimate(newGasFee);
        
        uint256 gasFee = token.getGasFeeEstimate();
        assertEq(gasFee, newGasFee);
    }

    function testSetGasFeeEstimateNotOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        token.setGasFeeEstimate(0.005 ether);
    }

    function testSetGasFeeEstimateTooHigh() public {
        vm.expectRevert("ITCToken20: Gas fee estimate too high");
        token.setGasFeeEstimate(0.11 ether); // > 0.1 ETH
    }

    function testFuzzCalculateBuyTokensCost(uint256 tokenAmount) public {
        vm.assume(tokenAmount > 0 && tokenAmount <= 1000 * 10**18);
        
        (uint256 totalCost, uint256 stripeFee, uint256 gasFee) = token.calculateBuyTokensCost(tokenAmount);
        
        uint256 tokenCost = (tokenAmount * TOKEN_PRICE) / 1e18; // Correct calculation
        uint256 expectedStripeFee = 0.0001 ether + (tokenCost * 290) / 10000; // Updated fixed fee
        uint256 expectedGasFee = 0.002 ether;
        uint256 expectedTotalCost = tokenCost + expectedStripeFee + expectedGasFee;
        
        assertEq(totalCost, expectedTotalCost);
        assertEq(stripeFee, expectedStripeFee);
        assertEq(gasFee, expectedGasFee);
    }

    function testFuzzCalculateWithdrawTokensNet(uint256 tokenAmount) public {
        vm.assume(tokenAmount >= 1000 * 10**18); // Large enough to cover fees
        vm.assume(tokenAmount <= 100000 * 10**18);
        
        (uint256 netAmount, uint256 stripeFee, uint256 gasFee) = token.calculateWithdrawTokensNet(tokenAmount);
        
        uint256 grossAmount = (tokenAmount * TOKEN_PRICE) / 1e18;
        uint256 expectedStripeFee = 0.0001 ether + (grossAmount * 290) / 10000;
        uint256 expectedGasFee = 0.002 ether;
        uint256 expectedNetAmount = grossAmount - expectedStripeFee - expectedGasFee;
        
        assertEq(netAmount, expectedNetAmount);
        assertEq(stripeFee, expectedStripeFee);
        assertEq(gasFee, expectedGasFee);
    }

    // ===== NEW TESTS FOR BURN TRACKING =====

    function testSelfBurn() public {
        // Transfer some tokens from owner to user1
        uint256 burnAmount = 1000 * 10**18;
        token.transfer(user1, burnAmount);
        
        uint256 initialSupply = token.totalSupply();
        uint256 initialTotalBurned = token.getTotalTokensBurned();
        uint256 initialTotalTransactions = token.getTotalBurnTransactions();
        
        // Expect TokensBurned event
        vm.expectEmit(true, false, false, true);
        emit TokensBurned(user1, burnAmount, 1, block.timestamp, burnAmount);
        
        vm.prank(user1);
        token.selfBurn(burnAmount);
        
        // Verify token balance
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), initialSupply - burnAmount);
        
        // Verify burn tracking
        assertEq(token.getTotalTokensBurned(), initialTotalBurned + burnAmount);
        assertEq(token.getTotalBurnTransactions(), initialTotalTransactions + 1);
    }

    function testSelfBurnZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Amount must be greater than zero");
        token.selfBurn(0);
    }

    function testSelfBurnInsufficientBalance() public {
        vm.prank(user1);
        vm.expectRevert("ITCToken20: Insufficient balance to burn");
        token.selfBurn(1000 * 10**18);
    }

    function testBurnWithTracking() public {
        // Transfer some tokens from owner to user1
        uint256 burnAmount = 1000 * 10**18;
        token.transfer(user1, burnAmount);
        
        uint256 initialSupply = token.totalSupply();
        uint256 initialTotalBurned = token.getTotalTokensBurned();
        uint256 initialTotalTransactions = token.getTotalBurnTransactions();
        
        // Expect TokensBurned event
        vm.expectEmit(true, false, false, true);
        emit TokensBurned(user1, burnAmount, 1, block.timestamp, burnAmount);
        
        token.burn(user1, burnAmount);
        
        // Verify token balance
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), initialSupply - burnAmount);
        
        // Verify burn tracking
        assertEq(token.getTotalTokensBurned(), initialTotalBurned + burnAmount);
        assertEq(token.getTotalBurnTransactions(), initialTotalTransactions + 1);
    }

    function testBurnTrackingMultipleBurns() public {
        // Transfer tokens to both users
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 500 * 10**18;
        
        token.transfer(user1, amount1);
        token.transfer(user2, amount2);
        
        uint256 initialTotalBurned = token.getTotalTokensBurned();
        uint256 initialTotalTransactions = token.getTotalBurnTransactions();
        
        // First burn
        vm.expectEmit(true, false, false, true);
        emit TokensBurned(user1, amount1, 1, block.timestamp, amount1);
        
        vm.prank(user1);
        token.selfBurn(amount1);
        
        // Second burn
        vm.expectEmit(true, false, false, true);
        emit TokensBurned(user2, amount2, 2, block.timestamp, amount1 + amount2);
        
        vm.prank(user2);
        token.selfBurn(amount2);
        
        // Verify cumulative tracking
        assertEq(token.getTotalTokensBurned(), initialTotalBurned + amount1 + amount2);
        assertEq(token.getTotalBurnTransactions(), initialTotalTransactions + 2);
    }

    function testGetBurnRecord() public {
        // Transfer and burn tokens
        uint256 burnAmount = 1000 * 10**18;
        token.transfer(user1, burnAmount);
        
        vm.prank(user1);
        token.selfBurn(burnAmount);
        
        // Get burn record
        (address burner, uint256 amount, uint256 timestamp, uint256 burnId) = token.getBurnRecord(1);
        
        assertEq(burner, user1);
        assertEq(amount, burnAmount);
        assertEq(timestamp, block.timestamp);
        assertEq(burnId, 1);
    }

    function testGetBurnRecordInvalidId() public {
        vm.expectRevert("ITCToken20: Invalid burn ID");
        token.getBurnRecord(1); // No burns yet
        
        vm.expectRevert("ITCToken20: Invalid burn ID");
        token.getBurnRecord(999); // Invalid ID
    }

    function testGetBurnRecordsRange() public {
        // Create multiple burns
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 500 * 10**18;
        uint256 amount3 = 250 * 10**18;
        
        token.transfer(user1, amount1);
        token.transfer(user2, amount2);
        token.transfer(user1, amount3);
        
        vm.prank(user1);
        token.selfBurn(amount1);
        
        vm.prank(user2);
        token.selfBurn(amount2);
        
        vm.prank(user1);
        token.selfBurn(amount3);
        
        // Get range of burn records (1-3)
        (address[] memory burners, uint256[] memory amounts, uint256[] memory timestamps, uint256[] memory burnIds) = token.getBurnRecordsRange(0, 3);
        
        assertEq(burners.length, 3);
        assertEq(amounts.length, 3);
        assertEq(timestamps.length, 3);
        assertEq(burnIds.length, 3);
        
        // Check first burn
        assertEq(burners[0], user1);
        assertEq(amounts[0], amount1);
        assertEq(burnIds[0], 1);
        
        // Check second burn
        assertEq(burners[1], user2);
        assertEq(amounts[1], amount2);
        assertEq(burnIds[1], 2);
        
        // Check third burn
        assertEq(burners[2], user1);
        assertEq(amounts[2], amount3);
        assertEq(burnIds[2], 3);
    }

    function testGetBurnRecordsRangeInvalidBounds() public {
        vm.expectRevert("ITCToken20: Start index out of bounds");
        token.getBurnRecordsRange(1, 2); // No burns yet
        
        // Create one burn
        token.transfer(user1, 1000 * 10**18);
        vm.prank(user1);
        token.selfBurn(1000 * 10**18);
        
        vm.expectRevert("ITCToken20: Invalid end index");
        token.getBurnRecordsRange(0, 0); // End <= start
    }

    function testGetBurnStatistics() public {
        // Create multiple burns with different amounts
        uint256 amount1 = 1000 * 10**18;
        uint256 amount2 = 500 * 10**18;
        uint256 amount3 = 250 * 10**18;
        
        token.transfer(user1, amount1);
        token.transfer(user2, amount2);
        token.transfer(user1, amount3);
        
        vm.prank(user1);
        token.selfBurn(amount1);
        
        vm.prank(user2);
        token.selfBurn(amount2);
        
        vm.prank(user1);
        token.selfBurn(amount3);
        
        // Get statistics
        (uint256 totalBurned, uint256 totalTransactions, uint256 averageBurnAmount) = token.getBurnStatistics();
        
        uint256 expectedTotal = amount1 + amount2 + amount3;
        uint256 expectedAverage = expectedTotal / 3;
        
        assertEq(totalBurned, expectedTotal);
        assertEq(totalTransactions, 3);
        assertEq(averageBurnAmount, expectedAverage);
    }

    function testGetBurnStatisticsNoBurns() public {
        (uint256 totalBurned, uint256 totalTransactions, uint256 averageBurnAmount) = token.getBurnStatistics();
        
        assertEq(totalBurned, 0);
        assertEq(totalTransactions, 0);
        assertEq(averageBurnAmount, 0);
    }

    function testGetAllBurnIds() public {
        // Initially empty
        uint256[] memory ids = token.getAllBurnIds();
        assertEq(ids.length, 0);
        
        // Create burns
        token.transfer(user1, 1000 * 10**18);
        token.transfer(user2, 500 * 10**18);
        
        vm.prank(user1);
        token.selfBurn(1000 * 10**18);
        
        vm.prank(user2);
        token.selfBurn(500 * 10**18);
        
        // Get all IDs
        ids = token.getAllBurnIds();
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    function testBurnTrackingWithWithdrawTokens() public {
        // Buy tokens first
        uint256 ethAmount = 1 ether;
        uint256 expectedTokens = (ethAmount * 1e18) / TOKEN_PRICE;
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        token.buyTokens{value: ethAmount}();
        
        uint256 initialTotalBurned = token.getTotalTokensBurned();
        uint256 initialTotalTransactions = token.getTotalBurnTransactions();
        
        // Withdraw tokens (this should trigger burn tracking)
        uint256 withdrawAmount = expectedTokens / 2;
        
        vm.prank(user1);
        token.withdrawTokens(withdrawAmount);
        
        // Note: withdrawTokens does NOT track burns - only burn() and selfBurn() do
        // So burn tracking should remain unchanged
        assertEq(token.getTotalTokensBurned(), initialTotalBurned);
        assertEq(token.getTotalBurnTransactions(), initialTotalTransactions);
    }

    function testFuzzSelfBurn(uint256 mintAmount, uint256 burnAmount) public {
        // Set reasonable bounds
        mintAmount = bound(mintAmount, 1000 * 10**18, 10000 * 10**18);
        burnAmount = bound(burnAmount, 100 * 10**18, mintAmount);
        
        // Transfer tokens to user1
        token.transfer(user1, mintAmount);
        
        uint256 initialTotalBurned = token.getTotalTokensBurned();
        uint256 initialTotalTransactions = token.getTotalBurnTransactions();
        uint256 initialSupply = token.totalSupply();
        
        vm.prank(user1);
        token.selfBurn(burnAmount);
        
        // Verify burn tracking
        assertEq(token.getTotalTokensBurned(), initialTotalBurned + burnAmount);
        assertEq(token.getTotalBurnTransactions(), initialTotalTransactions + 1);
        assertEq(token.totalSupply(), initialSupply - burnAmount);
        assertEq(token.balanceOf(user1), mintAmount - burnAmount);
    }
}
