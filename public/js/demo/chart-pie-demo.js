document.addEventListener('DOMContentLoaded', () => {
  // Fetch category-wise expenses data
  fetch('/category-expenses')
      .then(response => response.json())
      .then(data => {
          const categories = data.map(row => row.category);
          const amounts = data.map(row => row.totalAmount);

          const ctxP = document.getElementById('myPieChart').getContext('2d');
          new Chart(ctxP, {
              type: 'pie',
              data: {
                  labels: categories,
                  datasets: [{
                      data: amounts,
                      backgroundColor: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
                      hoverBackgroundColor: ['#2e59d9', '#17a673', '#2c9faf', '#f1c40f', '#e63946'],
                  }]
              }
          });
      });
});
