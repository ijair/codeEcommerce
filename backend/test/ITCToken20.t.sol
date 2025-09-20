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
    
    uint256 public constant INITIAL_SUPPLY = 100_000 * 10**18; // 10% of max supply
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    uint256 public constant TOKEN_PRICE = 0.001 ether;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethAmount);
    event TokensWithdrawn(address indexed seller, uint256 amount, uint256 ethAmount);
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
        assertEq(token.getRemainingSupply(), MAX_SUPPLY - INITIAL_SUPPLY);
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
        vm.expectRevert("ITCToken20: Debes enviar ETH");
        token.buyTokens{value: 0}();
    }

    function testBuyTokensInsufficientOwnerBalance() public {
        // First, transfer all owner tokens to user2 to simulate insufficient balance
        uint256 ownerBalance = token.balanceOf(owner);
        token.transfer(user2, ownerBalance);
        
        uint256 ethAmount = 1 ether;
        vm.deal(user1, ethAmount);
        
        vm.prank(user1);
        vm.expectRevert("ITCToken20: No hay suficientes tokens disponibles");
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
        uint256 amount = 1000 * 10**18;
        
        token.mint(user1, amount);
        
        assertEq(token.balanceOf(user1), amount);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + amount);
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
        
        // First mint some tokens to user1
        token.mint(user1, amount);
        
        // Then burn them
        token.burn(user1, amount);
        
        assertEq(token.balanceOf(user1), 0);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
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
        vm.expectRevert("ITCToken20: Debes enviar ETH");
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
}
