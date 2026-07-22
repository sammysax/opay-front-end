"use client";
import React, {useState,useEffect} from 'react';
import { MdDelete, MdAddCircle, MdRemoveCircle, MdShowChart, MdAccountBalanceWallet, MdNotifications, MdInbox} from "react-icons/md";
import { BiEdit } from "react-icons/bi";
import { IoEyeOffOutline } from "react-icons/io5";




function Page() {

  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('income');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');

  const [editTransaction, setEditTransaction] = useState(null);
  const [editAmount, setEditAmount] = useState({ description: '', category: '', amount: '' });
  






  const fetchTransactions = () => {
    fetch('http://localhost:5000/api/transactions', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "004bc5ead0c9dacda3121d9500d25ecede2b5e8f0593ae6ca71f5fd17d677bb4"
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.transactions || [];
        setTransactions(items);
      })
      .catch((error) => {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      });
  }
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/delete-transaction`, {
        method: 'DELETE',
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "004bc5ead0c9dacda3121d9500d25ecede2b5e8f0593ae6ca71f5fd17d677bb4"
        },
        body: JSON.stringify({ id })
      });
      const data = await response.json();
      if (response.ok) {
        fetchTransactions()
      
        alert("Transaction deleted successfully");
      } else {
        throw new Error(data.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert("Failed to delete transaction");
    }
  };


  const getAmountValue = (value) => {
    const normalized = String(value || '').replace(/[^0-9.-]+/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const isExpenseTransaction = (item) => {
    const amountValue = getAmountValue(item.amount);
    return amountValue < 0 || String(item.category || '').toLowerCase().includes('expense');
  };

  const formatAmount = (value) => {
    const amountValue = getAmountValue(value);
    if (!Number.isFinite(amountValue)) {
      return String(value);
    }
    return `${amountValue < 0 ? '-' : ''}₦${Math.abs(amountValue).toLocaleString()}`;
  };

  const totalBalance = transactions.reduce((sum, item) => sum + getAmountValue(item.amount), 0);

  const openTransactionForm = (type) => {
    setEditTransaction(null);
    setEditAmount({ description: '', category: '', amount: '' });
    setFormType(type);
    setFormAmount('');
    setFormDescription('');
    setFormError('');
    setShowForm(true);
  };

  const openEditTransaction = (transaction) => {
    const amountValue = getAmountValue(transaction.amount);
    const isExpense = amountValue < 0 || String(transaction.category || '').toLowerCase().includes('expense');
    const normalizedAmount = String(Math.abs(amountValue));

    setEditTransaction(transaction);
    setEditAmount({
      description: transaction.description || '',
      category: transaction.category || (isExpense ? 'Expense' : 'Income'),
      amount: normalizedAmount,
    });
    setFormType(isExpense ? 'expense' : 'income');
    setFormAmount(normalizedAmount);
    setFormDescription(transaction.description || '');
    setFormError('');
    setShowForm(true);
  };

  const closeTransactionForm = () => {
    setShowForm(false);
    setEditTransaction(null);
    setEditAmount({ description: '', category: '', amount: '' });
    setFormError('');
  };

  const handleTransactionSubmit = async (event) => {
    event.preventDefault();

    const amountValue = Number(formAmount);
    if (!formAmount || Number.isNaN(amountValue) || amountValue <= 0) {
      setFormError('Enter a valid amount greater than zero');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Enter a description');
      return;
    }

    const adjustedAmount = formType === 'expense' ? -Math.abs(amountValue) : Math.abs(amountValue);
    const payload = {
      description: formDescription.trim(),
      category: formType === 'expense' ? 'Expense' : 'Income',
      amount: adjustedAmount,
    };

    if (editTransaction) {
      const transactionId = editTransaction._id || editTransaction.id;
      try {
        const response = await fetch('http://localhost:5000/api/update-transaction', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': '004bc5ead0c9dacda3121d9500d25ecede2b5e8f0593ae6ca71f5fd17d677bb4',
          },
          body: JSON.stringify({ id: transactionId, ...payload }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        setTransactions((prev) =>
          prev.map((item) => {
            const itemId = item._id || item.id;
            return itemId === transactionId ? { ...item, ...payload, _id: transactionId, id: transactionId } : item;
          })
        );
        setShowForm(false);
        setFormAmount('');
        setFormDescription('');
        setFormError('');
        setEditTransaction(null);
        setEditAmount({ description: '', category: '', amount: '' });
        fetchTransactions();
        alert('Transaction updated successfully');
        return;
      } catch (error) {
        console.error('Error updating transaction:', error);
        setTransactions((prev) =>
          prev.map((item) => {
            const itemId = item._id || item.id;
            return itemId === transactionId ? { ...item, ...payload, _id: transactionId, id: transactionId } : item;
          })
        );
        setShowForm(false);
        setFormAmount('');
        setFormDescription('');
        setFormError('');
        setEditTransaction(null);
        setEditAmount({ description: '', category: '', amount: '' });
        fetchTransactions();
        alert('Transaction updated locally. The server endpoint was unavailable.');
      }
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/create-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': '004bc5ead0c9dacda3121d9500d25ecede2b5e8f0593ae6ca71f5fd17d677bb4',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      alert('Transaction saved successfully');
      const createdTransaction = await response.json();
      const transactionToAdd = {
        ...payload,
        _id: createdTransaction._id || createdTransaction.id || `txn-${formType}-${new Date().toISOString().replace(/[:.]/g, '-')}`,
      };

      setTransactions((prev) => [transactionToAdd, ...prev]);
      setShowForm(false);
      setFormAmount('');
      setFormDescription('');
      setFormError('');
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      setFormError('Failed to save transaction. Please try again.');
    }
  };

  return (
    <div className="container">

      {/* {
        transactions.map((item) => (
          <div key={item._id}>
            <p>{item.description}</p>
            <p>{item.amount}</p>
            <p>{item.category}</p>
          </div>
        ))
      } */}

      <div className="dashboard">
       
        {/* Header Section */}
        <div className="header">
          <div className="userInfo">
            <div className="avatar">S</div>
            <div className="greeting">
              <p>Welcome Back</p>
              <h2>Samuel</h2>
            </div>
          </div>
          <div className="notificationWrapper">
            <button className="notificationBtn">
            <MdNotifications size={25} />
            <span className="notificationDot"></span>
          </button>
          </div>
          
        </div>

        {/* Main Available Balance Card */}
        <div className="balanceCard">
          <p className="balanceLabel">Available Balance</p>
          <h1 className="balanceAmount">₦{Math.abs(totalBalance).toLocaleString()}</h1>
          {/* <IoEyeOffOutline className="eye" /> */}
          

          <div className="cardFooter">
            <p className="cardNumber">5399 **** **** 2147</p>
            <span className="cardType">VISA</span>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="actionGrid">
          <button type="button" className="actionBtn" onClick={() => openTransactionForm('income')}>
            <div className="iconGreen">
              <MdAddCircle size={30} />
            </div>
            <span>Add Income</span>
          </button>

          <button type="button" className="actionBtn" onClick={() => openTransactionForm('expense')}>
            <div className="iconRed">
              <MdRemoveCircle size={30} />
            </div>
            <span>Add Expense</span>
          </button>

          <button type="button" className="actionBtn">
            <div className="iconBlue">
              <MdShowChart size={30} />
            </div>
            <span>Analytics</span>
          </button>

          <button type="button" className="actionBtn">
            <div className="iconAmber">
              <MdAccountBalanceWallet size={30} />
            </div>
            <span>Wallet</span>
          </button>
        </div>

        {showForm && (
          <div className="transactionFormOverlay" onClick={closeTransactionForm}>
            <div className="transactionFormCard" onClick={(e) => e.stopPropagation()}>
              <h3>{editTransaction ? 'Edit Transaction' : formType === 'expense' ? 'Add Expense' : 'Add Income'}</h3>
              <form onSubmit={handleTransactionSubmit} className="transactionForm">
                <label>
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    value={formAmount}
                    onChange={(e) => {
                      setFormAmount(e.target.value);
                      setEditAmount((prev) => ({ ...prev, amount: e.target.value }));
                    }}
                    placeholder="Enter amount"
                    className="amountInput"
                  />
                </label>
                <label>
                  Description
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => {
                      setFormDescription(e.target.value);
                      setEditAmount((prev) => ({ ...prev, description: e.target.value }));
                    }}
                    placeholder="Enter description"
                    className="descriptionInput"
                  />
                </label>
                {formError && <p className="formError">{formError}</p>}
                <div className="formButtons">
                  <button type="submit" className="submitBtn">
                    {editTransaction ? 'Save Changes' : formType === 'expense' ? 'Submit Expense' : 'Submit Income'}
                  </button>
                  <button type="button" className="cancelBtn" onClick={closeTransactionForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Income & Expense Summaries */}
        <div className="summaryGrid">
          <div className="summaryCard">
            <p className="summaryLabel">Total Income</p>
            <p className="incomeAmount">₦0</p>
          </div>
         
          <div className="summaryCard">
            <p className="summaryLabel">Total Expense</p>
            <p className="expenseAmount">₦0</p>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="transactions">
          <h3>Recent Transactions</h3>

          {Array.isArray(transactions) && transactions.length > 0 ? (
            transactions.map((item) => (
              <div key={item._id || item.id} className="transactionItem">
                <div className="transactionDetails">
                  <p className="transactionTitle">{item.description}</p>
                  <p className="transactionCategory">{item.category}</p>
                </div>
                <div className="transactionRight">
                  <p
                    className={`transactionAmount ${isExpenseTransaction(item) ? 'negative' : 'positive'}`}
                  >
                    {formatAmount(item.amount)}
                  </p>
                  <MdDelete className="deleteIcon"
                      onClick={() => deleteTransaction (item._id)}
                  />
                </div>
                <p className="transactionDate">{new Date(item.createdAt).toLocaleString()}</p>
                <button type="button" className="editIconButton" onClick={() => openEditTransaction(item)}>
                  <BiEdit className="editIcon" />
                </button>
              </div>
            ))
          ) : (
            <div className="emptyState">
              <div className="emptyIconWrapper">
              <MdInbox size={24} />
            </div>
            <p>No transactions yet</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Page;
