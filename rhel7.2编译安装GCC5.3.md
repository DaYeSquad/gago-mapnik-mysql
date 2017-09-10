##配置yum源
yum install m4 gcc make bzip2 -y
wget https://rpm.nodesource.com/pub_6.x/el/6/x86_64/nodejs-6.11.2-1nodesource.el6.x86_64.rpm
rpm -ivh nodejs-6.11.2-1nodesource.el7.centos.x86_64.rpm

##下载依赖包
cd opt
wget http://ftp.gnu.org/gnu/gcc/gcc-5.3.0/gcc-5.3.0.tar.gz
wget ftp://gcc.gnu.org/pub/gcc/infrastructure/gmp-4.3.2.tar.bz2
wget ftp://gcc.gnu.org/pub/gcc/infrastructure/gmp-4.3.2.tar.bz2

##创建安装目录
mkdir /usr/local/gcc-5.3.0
mkdir /usr/local/gmp-4.3.2
mkdir /usr/local/mpfr-2.4.2
mkdir /usr/local/mpc-0.8.1

##严格按照顺序编译，相互依赖
#编译gmp
tar jxvf gmp-4.3.2.tar.bz2
cd gmp-4.3.2
./configure --prefix=/usr/local/gmp-4.3.2
make
make install

#编译mpfr
tar jxvf mpfr-2.4.2.tar.bz2
cd mpfr-2.4.2
./configure --prefix=/usr/local/mpfr-2.4.2 --with-gmp=/usr/local/gmp-4.3.2
make
make install

#编译mpc
tar zxvf mpc-0.8.1.tar.gz
cd mpc-0.8.1.tar.gz
./configure --prefix=/usr/local/mpc-0.8.1 --with-gmp=/usr/local/gmp-4.3.2 --with-mpfr=/usr/local/mpfr-2.4.2
make
make install

##添加环境变量
echo "export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/mpc-0.8.1/lib:/usr/local/gmp-4.3.2/lib:/usr/local/mpfr-2.4.2/lib" >> /etc/profile
source /etc/profile

##编译gcc
tar zxvf gcc-5.3.0.tar.gz
cd gcc-5.3.0
./configure --prefix=/usr/local/gcc-5.3.0 -enable-threads=posix -disable-checking -disable-multilib -enable-languages=c,c++ --with-gmp=/usr/local/gmp-4.3.2 --with-mpfr=/usr/local/mpfr-2.4.2 --with-mpc=/usr/local/mpc-0.8.1
#make 过程非常耗时，建议在screen中执行，或nohup，防止终端断开，进程停止。
make
make install

##将新版本的gcc加入命令搜索路径中
ln -s /usr/local/gcc-5.3.0/bin/gcc gcc
ln -s /usr/local/gcc-5.3.0/bin/g++ g++

## 移除旧版本gcc命令
which gcc
mv /usr/bin/gcc /usr/bin/gcc.bak

## 添加gcc环境变量
echo "PATH=\$PATH:/usr/local/gcc-5.3.0/bin" >>/etc/profile
echo "export PATH"  >>/etc/profile
source /etc/profile

## 添加函数库路径
echo "/usr/local/gcc-5.3.0/lib64" >>/etc/ld.so.conf
ldconfig -f

## 验证
gcc -v
如果仍然显示4.8，可重新加载下配置文件
source /etc/profile

strings /usr/local/gcc-5.3.0/lib64/libstdc++.so.6 | grep GLIBCXX
出现3.4.20以上版本，成功。

## 删除编译产生的临时文件
cd /opt
rm -rf gcc-5.3.0*
rm -rf gmp-4.3.2*
rm -rf mpfr-2.4.2*
rm -rf mpc-0.8.1*
